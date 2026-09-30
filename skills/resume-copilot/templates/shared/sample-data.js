window.KAMI_RESUME_DATA = {
  "id": "resume-view-sample",
  "targetId": "target-backend-ai",
  "header": {
    "name": "张知行",
    "targetRole": "后端开发工程师 / AI 应用方向",
    "educationInline": "华东理工大学 · 软件工程 · 2021.9 – 2025.6",
    "contacts": [
      {
        "label": "GitHub",
        "value": "github.com/zhangzhixing",
        "href": "https://github.com/zhangzhixing"
      },
      {
        "label": "邮箱",
        "value": "zhangzhixing@example.com",
        "href": "mailto:zhangzhixing@example.com"
      }
    ]
  },
  "skills": [
    {
      "label": "AI 应用",
      "description": "RAG、Agent Workflow、结构化输出与工具调用，能把效果与 **token 成本** 一起看。"
    },
    {
      "label": "后端开发",
      "description": "Java、Python、FastAPI、Spring Boot，熟悉 **接口性能优化** 的常用手段。"
    },
    {
      "label": "工程化",
      "description": "Docker、Git、日志与可观测性，习惯用 **指标** 而不是感觉判断线上问题。"
    }
  ],
  "sections": [
    {
      "type": "work",
      "title": "工作经历",
      "range": "2023.07 - 2024.09",
      "entries": [
        {
          "time": "2024.06 - 2024.09",
          "title": "某智能平台公司",
          "meta": "后端开发实习生 / 上海",
          "summaryBullets": [
            {
              "id": "bullet-sample-1",
              "text": "承担策略服务的接口开发与联调，覆盖需求澄清到线上问题定位的完整流程。",
              "claimIds": [
                "claim-sample-1"
              ],
              "metricIds": []
            }
          ],
          "subBlocks": [
            {
              "title": "策略服务",
              "bullets": [
                {
                  "id": "bullet-sample-2",
                  "text": "把重复的业务判断逻辑抽象为可配置规则，减少业务侧硬编码与跨团队重复沟通。",
                  "claimIds": [
                    "claim-sample-2"
                  ],
                  "metricIds": []
                },
                {
                  "id": "bullet-sample-3",
                  "text": "排查超时链路并把热点查询改为缓存加批量读取，接口 **P99 延迟** 从 **800ms** 降到 **220ms**。",
                  "claimIds": [
                    "claim-sample-3"
                  ],
                  "metricIds": [
                    "metric-sample-1"
                  ]
                }
              ]
            },
            {
              "title": "配置与稳定性",
              "bullets": [
                {
                  "id": "bullet-sample-9",
                  "text": "把散落各处的策略配置收敛到统一配置中心，改一次即可全量生效，回滚从小时级降到 **分钟级**。",
                  "claimIds": [
                    "claim-sample-9"
                  ],
                  "metricIds": []
                },
                {
                  "id": "bullet-sample-10",
                  "text": "给核心接口补上超时、重试与熔断，配合压测把大促前的容量评估从拍脑袋变成有数据支撑。",
                  "claimIds": [
                    "claim-sample-10"
                  ],
                  "metricIds": []
                }
              ]
            },
            {
              "title": "工程效率",
              "bullets": [
                {
                  "id": "bullet-sample-11",
                  "text": "把重复的联调脚手架抽成命令行工具，新接口从建工程到跑通本地联调的时间明显缩短。",
                  "claimIds": [
                    "claim-sample-11"
                  ],
                  "metricIds": []
                },
                {
                  "id": "bullet-sample-12",
                  "text": "在 CI 里加上静态检查与契约测试，接口变更引发的联调返工显著减少。",
                  "claimIds": [
                    "claim-sample-12"
                  ],
                  "metricIds": []
                }
              ]
            }
          ]
        },
        {
          "time": "2023.07 - 2023.10",
          "title": "某互联网公司",
          "meta": "服务端开发实习生 / 杭州",
          "summaryBullets": [
            {
              "id": "bullet-work2-1",
              "text": "在订单中台做服务端开发，覆盖下单、履约与对账三条主链路的迭代。",
              "claimIds": [
                "claim-work2-1"
              ],
              "metricIds": []
            }
          ],
          "subBlocks": [
            {
              "title": "订单履约",
              "bullets": [
                {
                  "id": "bullet-work2-2",
                  "text": "把下单链路里重复的参数校验与幂等判断收敛到统一入口，超卖与重复下单的线上问题清零。",
                  "claimIds": [
                    "claim-work2-2"
                  ],
                  "metricIds": []
                },
                {
                  "id": "bullet-work2-3",
                  "text": "给履约状态机补上补偿任务与人工兜底，异常订单不再依赖人工捞数据修复。",
                  "claimIds": [
                    "claim-work2-3"
                  ],
                  "metricIds": []
                }
              ]
            },
            {
              "title": "对账与数据",
              "bullets": [
                {
                  "id": "bullet-work2-4",
                  "text": "把 **T+1** 对账从全量跑批改为按商户增量计算，对账完成时间提前到次日凌晨前。",
                  "claimIds": [
                    "claim-work2-4"
                  ],
                  "metricIds": []
                },
                {
                  "id": "bullet-work2-5",
                  "text": "为对账差异沉淀排查手册与看板，常见差异从逐笔核对变成按规则定位。",
                  "claimIds": [
                    "claim-work2-5"
                  ],
                  "metricIds": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "project",
      "title": "项目经历",
      "entries": [
        {
          "time": "2024.03 - 2024.05",
          "title": "智能问答工作台",
          "link": "https://github.com/zhangzhixing/qa-workbench",
          "summaryBullets": [
            {
              "id": "bullet-sample-4",
              "text": "从 0 到 1 搭建内部知识问答工作台，串起检索、编排、引用与反馈的完整闭环。",
              "claimIds": [
                "claim-sample-4"
              ],
              "metricIds": []
            }
          ],
          "subBlocks": [
            {
              "title": "检索与问答编排",
              "bullets": [
                {
                  "id": "bullet-sample-5",
                  "text": "设计知识库检索与问答编排流程，覆盖语义切片、向量召回与引用展示三个环节。",
                  "claimIds": [
                    "claim-sample-5"
                  ],
                  "metricIds": []
                },
                {
                  "id": "bullet-sample-6",
                  "text": "把答案生成与引用展示解耦、分开调优，**引用准确率** 从 **78%** 提升到 **92%**。",
                  "claimIds": [
                    "claim-sample-6"
                  ],
                  "metricIds": [
                    "metric-sample-2"
                  ]
                }
              ]
            },
            {
              "title": "稳定性与可观测",
              "bullets": [
                {
                  "id": "bullet-sample-7",
                  "text": "补齐异常兜底与日志追踪，把失败请求的定位时间从小时级压到 **分钟级**。",
                  "claimIds": [
                    "claim-sample-7"
                  ],
                  "metricIds": []
                },
                {
                  "id": "bullet-sample-8",
                  "text": "给检索与生成链路补上埋点与采样回放，线上问题可复现，回归排查不再靠猜。",
                  "claimIds": [
                    "claim-sample-8"
                  ],
                  "metricIds": []
                }
              ]
            }
          ],
          "tags": [
            "Python",
            "FastAPI",
            "RAG"
          ]
        }
      ]
    },
    {
      "type": "open_source",
      "title": "开源经历",
      "entries": [
        {
          "time": "2024.03 - 2024.09",
          "title": "OpenSumi",
          "meta": "阿里巴巴开源社区",
          "bullets": [
            {
              "id": "bullet-oss-1",
              "text": "OpenSumi 是一个基于 React 的框架，可帮助用户在 Web 或 Electron 上快速构建和定制 IDE，并兼容 VS Code 插件。",
              "claimIds": [
                "claim-oss-1"
              ],
              "metricIds": []
            },
            {
              "id": "bullet-oss-2",
              "text": "主要贡献：设计并实现非递归文件监听系统，为周边系统提供统一监听能力，并支持其他模块按需配置与复用。",
              "claimIds": [
                "claim-oss-2"
              ],
              "metricIds": []
            }
          ]
        },
        {
          "time": "2023.05 - 2023.10",
          "title": "OpenTiny",
          "meta": "华为开源社区",
          "bullets": [
            {
              "id": "bullet-oss-3",
              "text": "TinyEngine 是一个具备灵活扩展能力的低代码引擎。",
              "claimIds": [
                "claim-oss-3"
              ],
              "metricIds": []
            },
            {
              "id": "bullet-oss-4",
              "text": "主要贡献：负责低代码 Schema 转 React Hooks 版本 DSL 的出码能力实现。",
              "claimIds": [
                "claim-oss-4"
              ],
              "metricIds": []
            }
          ]
        }
      ]
    }
  ],
  "highlightClaimIds": [],
  "notes": [],
  "renderOptions": {
    "renderer": "kami",
    "theme": "kami-default",
    "format": "html"
  }
};
