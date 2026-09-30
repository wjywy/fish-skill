#!/usr/bin/env bash
#
# ensure-fonts.sh — make the resume template's serif face available locally.
#
# Why this exists
# ---------------
# templates/shared/kami-family.css declares @font-face for 仓耳今楷 (TsangerJinKai02
# W04/W05) with two sources: a local relative path and a jsDelivr CDN URL. The
# font files are deliberately NOT committed (see templates/README.md): they are
# ~18 MB each and are not licensed for redistribution. So in a fresh checkout the
# relative source 404s and rendering depends entirely on the CDN.
#
# That is fine online, but it fails badly offline. Measured 2026-09-30: with no
# font available the browser falls back to the macOS system Songti, and the PDF
# text layer then maps common characters onto KANGXI RADICAL code points
# (行→U+2F98, 工→U+2F00, 大→U+2F04 …). Glyphs look identical but the code points
# differ, so an ATS / resume parser cannot match keywords like "工作经历" at all.
#
# This script repairs that by placing the fonts where the font stack can find
# them, so the `local("TsangerJinKai02-W04"/"-W05")` sources in kami-layout.css
# resolve.
#
# Design borrowed from upstream tw93/Kami (skills/kami/scripts/ensure-fonts.sh):
#   * download target lives OUTSIDE the skill directory, so a skill install
#     (bin/fish-skill.mjs install copies the whole skill tree, and npm packs
#     skills/) never has to carry 36 MB of fonts;
#   * every candidate is size-validated before it replaces a good file, so a
#     captive-portal HTML page can never be mistaken for a font;
#   * temp files carry this run's PID and are swept on exit, so an interrupted
#     run leaves nothing behind and two concurrent runs do not collide.
#
# One deviation from upstream, because our consumption path differs: Kami renders
# with WeasyPrint, which resolves fonts through fontconfig (the XDG font dir is on
# its default scan path). We render to HTML and the user prints from a browser,
# and on macOS browsers use CoreText, which does NOT scan ~/.local/share/fonts.
# So on macOS we additionally register the fonts in the per-user CoreText font
# directory, ~/Library/Fonts. Pass --no-system or set RESUME_NO_SYSTEM_FONTS=1 to
# skip that, and --uninstall to undo it.
#
# Registration uses a HARD LINK, not a symlink and not a copy. Measured
# 2026-09-30 on macOS 15 / Chrome: a symlink in ~/Library/Fonts is NOT picked up
# by CoreText (every `local()` probe stayed false), a real file is. A hard link
# is a real directory entry for the same inode, so CoreText accepts it while the
# 36 MB is not duplicated; we fall back to `cp` on filesystems that refuse links.
#
# Usage:
#   scripts/ensure-fonts.sh              # check, download what is missing, register
#   scripts/ensure-fonts.sh --check      # report status only, never write anything
#   scripts/ensure-fonts.sh --no-system  # download only, do not touch system font dirs
#   scripts/ensure-fonts.sh --uninstall  # remove the macOS registration this script made
#
# Environment:
#   RESUME_FONT_DIR        where the font files live
#                          (default: ${XDG_DATA_HOME:-~/.local/share}/fonts/kami)
#   KAMI_FONT_DIR          honoured as a fallback for the same setting, so a machine
#                          that already ran upstream Kami's installer reuses its copy
#   RESUME_MACOS_FONT_DIR  override the macOS registration directory
#   RESUME_NO_SYSTEM_FONTS 1 = same as --no-system
#
# Portable across bash 3.2+ (stock macOS /bin/bash) and bash 4+ (Linux, Homebrew).
# Avoids `declare -A` so it runs on a fresh macOS without `brew install bash`.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# A repo checkout may carry the fonts privately under <repo>/assets/fonts (that
# path is gitignored). Templates then resolve their relative @font-face source
# directly and there is nothing to download.
REPO_FONT_DIR="$(cd "$SKILL_DIR/../.." && pwd)/assets/fonts"

# Download target lives OUTSIDE the skill directory on purpose — see header.
FONT_DIR="${RESUME_FONT_DIR:-${KAMI_FONT_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/fonts/kami}}"

MODE="install"
SYSTEM_FONTS=1
for arg in "$@"; do
  case "$arg" in
    --check) MODE="check" ;;
    --uninstall) MODE="uninstall" ;;
    --no-system) SYSTEM_FONTS=0 ;;
    -h|--help) sed -n '2,50p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Try --help." >&2
      exit 2
      ;;
  esac
done
if [ "${RESUME_NO_SYSTEM_FONTS:-0}" = "1" ]; then
  SYSTEM_FONTS=0
fi

# Partial downloads from an interrupted run must not linger in FONT_DIR, and two
# concurrent runs must not fight over one temp path.
TMP_SUFFIX="tmp.$$"
cleanup_tmp() {
  rm -f "$FONT_DIR"/*."$TMP_SUFFIX" 2>/dev/null || true
}
trap cleanup_tmp EXIT

# 10 MB floor for TsangerJinKai (large CJK glyph set; real files are ~18 MB).
MIN_SIZE_CN=10000000

# Official download name (Chinese) vs the ASCII filename the template expects.
CN_NAMES=("仓耳今楷02-W04.ttf" "仓耳今楷02-W05.ttf")
CN_LOCAL_NAMES=("TsangerJinKai02-W04.ttf" "TsangerJinKai02-W05.ttf")

# Mirror order is jsdmirror-first here, opposite of the template's @font-face
# fallback (which lists jsdelivr first). Reasoning is upstream's: this script runs
# interactively when fonts are missing, often from China where jsdmirror is
# reachable and faster; the template runs anywhere and prefers jsdelivr's broader
# global coverage.
MIRROR_SOURCES=(
  "https://cdn.jsdmirror.com/gh/tw93/Kami@main/assets/fonts"
  "https://cdn.jsdelivr.net/gh/tw93/Kami@main/assets/fonts"
)

# macOS browsers match fonts through CoreText, which does not read the XDG font
# dir. ~/Library/Fonts is the per-user CoreText location and needs no sudo.
MACOS_FONT_DIR="${RESUME_MACOS_FONT_DIR:-$HOME/Library/Fonts}"

check_size() {
  local file="$1"
  local min_size="$2"
  [ -f "$file" ] || return 1
  local size
  size=$(wc -c < "$file" | tr -d ' ')
  [ "$size" -ge "$min_size" ]
}

cn_present_in() {
  local dir="$1" name
  for name in "${CN_LOCAL_NAMES[@]}"; do
    check_size "$dir/$name" "$MIN_SIZE_CN" || return 1
  done
  return 0
}

refresh_fontconfig() {
  # The XDG font dir is already on fontconfig's default scan path, so a cache
  # refresh is all that is needed for fontconfig-based consumers to pick the
  # fonts up. Optional: absence of fc-cache (e.g. minimal sandbox) is non-fatal,
  # fontconfig rescans the directory lazily on next use.
  if command -v fc-cache >/dev/null 2>&1; then
    fc-cache -f "$FONT_DIR" >/dev/null 2>&1 || true
  fi
}

# --- system registration -----------------------------------------------------

system_fonts_wanted() {
  [ "$SYSTEM_FONTS" = "1" ] || return 1
  [ "$(uname -s)" = "Darwin" ] || return 1
  return 0
}

# True when $1 is something this script created for $2: either a hard link to it
# (same device + inode) or a symlink pointing at it. A user's own copy of the
# font — same name, different inode — is deliberately NOT claimed.
is_ours() {
  local candidate="$1"
  local target="$2"
  [ -e "$candidate" ] || return 1
  if [ -L "$candidate" ]; then
    [ "$(readlink "$candidate")" = "$target" ]
    return $?
  fi
  [ "$candidate" -ef "$target" ]
}

register_system_fonts() {
  local name target dest
  mkdir -p "$MACOS_FONT_DIR"
  for name in "${CN_LOCAL_NAMES[@]}"; do
    target="$FONT_DIR/$name"
    dest="$MACOS_FONT_DIR/$name"
    check_size "$target" "$MIN_SIZE_CN" || continue

    if [ -e "$dest" ]; then
      if is_ours "$dest" "$target"; then
        echo "  OK: $dest already registered"
        continue
      fi
      echo "  SKIP: $dest exists and is not ours — leaving it alone"
      continue
    fi

    if ln "$target" "$dest" 2>/dev/null; then
      echo "  OK: hard-linked $dest"
    elif cp "$target" "$dest" 2>/dev/null; then
      echo "  OK: copied $dest (filesystem refused a hard link)"
    else
      echo "  ERROR: could not register $dest"
      return 1
    fi
  done
}

unregister_system_fonts() {
  local name target dest removed=0
  for name in "${CN_LOCAL_NAMES[@]}"; do
    target="$FONT_DIR/$name"
    dest="$MACOS_FONT_DIR/$name"
    if is_ours "$dest" "$target"; then
      rm -f "$dest"
      echo "  removed $dest"
      removed=$((removed + 1))
    elif [ -e "$dest" ]; then
      echo "  SKIP: $dest is not ours — leaving it alone"
    fi
  done
  if [ "$removed" -eq 0 ]; then
    echo "  nothing to remove from $MACOS_FONT_DIR"
  fi
}

# --- downloading -------------------------------------------------------------

download_tsanger() {
  local cn_name="$1"
  local local_name="$2"
  local target="$FONT_DIR/$local_name"
  local official_url="https://tsanger.cn/download/${cn_name}"
  local src url

  echo "  Trying: tsanger.cn (official)"
  if curl --retry 2 --connect-timeout 15 --max-time 300 -fSL "$official_url" \
      -o "$target.$TMP_SUFFIX" 2>/dev/null; then
    if check_size "$target.$TMP_SUFFIX" "$MIN_SIZE_CN"; then
      mv "$target.$TMP_SUFFIX" "$target"
      echo "  OK: $local_name downloaded ($(du -h "$target" | cut -f1))"
      return 0
    fi
    echo "  rejected: response was smaller than $MIN_SIZE_CN bytes"
    rm -f "$target.$TMP_SUFFIX"
  else
    rm -f "$target.$TMP_SUFFIX"
  fi

  for src in "${MIRROR_SOURCES[@]}"; do
    url="$src/$local_name"
    echo "  Trying: $url"
    if curl --retry 2 --connect-timeout 15 --max-time 300 -fSL "$url" \
        -o "$target.$TMP_SUFFIX" 2>/dev/null; then
      if check_size "$target.$TMP_SUFFIX" "$MIN_SIZE_CN"; then
        mv "$target.$TMP_SUFFIX" "$target"
        echo "  OK: $local_name downloaded ($(du -h "$target" | cut -f1))"
        return 0
      fi
      echo "  rejected: response was smaller than $MIN_SIZE_CN bytes"
      rm -f "$target.$TMP_SUFFIX"
    else
      rm -f "$target.$TMP_SUFFIX"
    fi
  done

  echo "  ERROR: all sources failed for $local_name"
  return 1
}

report_status() {
  local dir name missing
  for dir in "$REPO_FONT_DIR" "$FONT_DIR"; do
    if cn_present_in "$dir"; then
      echo "OK:   TsangerJinKai02 W04/W05 present in $dir"
    else
      echo "MISS: TsangerJinKai02 W04/W05 not present in $dir"
    fi
  done

  if [ "$(uname -s)" != "Darwin" ]; then
    echo "N/A:  system registration (fontconfig reads $FONT_DIR directly)"
    return 0
  fi
  missing=0
  for name in "${CN_LOCAL_NAMES[@]}"; do
    is_ours "$MACOS_FONT_DIR/$name" "$FONT_DIR/$name" || missing=$((missing + 1))
  done
  if [ "$missing" -eq 0 ]; then
    echo "OK:   registered for macOS browsers in $MACOS_FONT_DIR"
  else
    echo "MISS: $missing of ${#CN_LOCAL_NAMES[@]} not registered in $MACOS_FONT_DIR"
    echo "      (macOS browsers use CoreText and do not read $FONT_DIR)"
  fi
}

# --- main --------------------------------------------------------------------

case "$MODE" in
  check)
    report_status
    exit 0
    ;;
  uninstall)
    echo "Removing system font registration ..."
    unregister_system_fonts
    echo ""
    echo "Note: the font files themselves are still in $FONT_DIR"
    echo "      (they are shared with upstream Kami — remove them manually if unwanted)."
    exit 0
    ;;
esac

if cn_present_in "$REPO_FONT_DIR"; then
  echo "OK: TsangerJinKai fonts present in the repo checkout ($REPO_FONT_DIR)"
  echo "    Templates resolve their relative @font-face source; nothing to do."
  exit 0
fi

failed=0
mkdir -p "$FONT_DIR"
if cn_present_in "$FONT_DIR"; then
  echo "OK: TsangerJinKai fonts present ($FONT_DIR)"
else
  echo "Downloading TsangerJinKai fonts to $FONT_DIR ..."
  for i in "${!CN_NAMES[@]}"; do
    cn_name="${CN_NAMES[$i]}"
    local_name="${CN_LOCAL_NAMES[$i]}"
    if check_size "$FONT_DIR/$local_name" "$MIN_SIZE_CN"; then
      echo "  OK: $local_name already present"
      continue
    fi
    if ! download_tsanger "$cn_name" "$local_name"; then
      failed=$((failed + 1))
    fi
  done
fi

if [ "$failed" -gt 0 ]; then
  echo ""
  echo "Some font files could not be downloaded. Alternatives:"
  echo "  1. Install Source Han Serif SC: brew install --cask font-source-han-serif-sc"
  echo "  2. Copy 仓耳今楷02-W04.ttf / -W05.ttf (renamed to TsangerJinKai02-W04.ttf /"
  echo "     -W05.ttf) into $FONT_DIR"
  echo "  3. Stay online while printing — the template's CDN source still applies."
  exit 1
fi

if system_fonts_wanted; then
  echo "Registering fonts for macOS browsers (CoreText) ..."
  register_system_fonts
else
  if [ "$SYSTEM_FONTS" = "0" ]; then
    echo "Skipping system registration (--no-system)."
  else
    echo "Not macOS — fontconfig picks $FONT_DIR up on its default scan path."
  fi
fi

refresh_fontconfig
echo "OK: all fonts ready"
