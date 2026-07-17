"use strict";

/*
 * 奥斯达通信后台控制台
 *
 * 功能：
 * 1. 统计新闻总数、发布数量和草稿数量
 * 2. 统计全部留言和新留言数量
 * 3. 显示最近新闻
 * 4. 显示最近客户留言
 * 5. 刷新控制台真实数据
 */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await waitForDashboardAdminReady();

    const supabase =
      window.ostarSupabase;

    const dashboardPanel =
      document.getElementById(
        "dashboardPanel"
      );

    if (!dashboardPanel) {
      return;
    }


    /* =====================================
       页面元素
    ===================================== */

    const totalNewsCountElement =
      document.getElementById(
        "dashboardTotalNewsCount"
      );

    const publishedNewsCountElement =
      document.getElementById(
        "dashboardPublishedNewsCount"
      );

    const draftNewsCountElement =
      document.getElementById(
        "dashboardDraftNewsCount"
      );

    const newMessageCountElement =
      document.getElementById(
        "dashboardNewMessageCount"
      );

    const totalMessageCountElement =
      document.getElementById(
        "dashboardTotalMessageCount"
      );

    const updatedTimeElement =
      document.getElementById(
        "dashboardUpdatedTime"
      );

    const recentNewsList =
      document.getElementById(
        "dashboardRecentNewsList"
      );

    const recentMessageList =
      document.getElementById(
        "dashboardRecentMessageList"
      );

    const refreshButton =
      document.getElementById(
        "refreshDashboardButton"
      );


    if (!supabase) {
      showDashboardGlobalError(
        "Supabase 数据服务没有成功连接。"
      );

      return;
    }


    let dashboardIsLoading = false;


    /* =====================================
       读取控制台全部数据
    ===================================== */

    async function loadDashboardData() {
      if (dashboardIsLoading) {
        return;
      }

      dashboardIsLoading = true;

      setDashboardLoading();

      try {
        const [
          totalNewsResult,
          publishedNewsResult,
          draftNewsResult,
          recentNewsResult,
          totalMessagesResult,
          newMessagesResult,
          recentMessagesResult
        ] = await Promise.all([

          /* 新闻总数 */
          supabase
            .from("news")
            .select(
              "id",
              {
                count: "exact",
                head: true
              }
            ),


          /* 已发布新闻数量 */
          supabase
            .from("news")
            .select(
              "id",
              {
                count: "exact",
                head: true
              }
            )
            .eq(
              "status",
              "published"
            ),


          /* 草稿数量 */
          supabase
            .from("news")
            .select(
              "id",
              {
                count: "exact",
                head: true
              }
            )
            .eq(
              "status",
              "draft"
            ),


          /* 最近新闻 */
          supabase
            .from("news")
            .select(`
              id,
              title,
              slug,
              category,
              status,
              summary,
              published_at,
              created_at,
              updated_at
            `)
            .order(
              "updated_at",
              {
                ascending: false
              }
            )
            .limit(4),


          /* 全部客户留言数量 */
          supabase
            .from("contact_messages")
            .select(
              "id",
              {
                count: "exact",
                head: true
              }
            ),


          /* 新留言数量 */
          supabase
            .from("contact_messages")
            .select(
              "id",
              {
                count: "exact",
                head: true
              }
            )
            .eq(
              "status",
              "new"
            ),


          /* 最近客户留言 */
          supabase
            .from("contact_messages")
            .select(`
              id,
              name,
              company,
              phone,
              email,
              service_type,
              message,
              status,
              created_at
            `)
            .order(
              "created_at",
              {
                ascending: false
              }
            )
            .limit(4)

        ]);


        /*
         * 检查每一个数据库请求。
         */
        const results = [
          totalNewsResult,
          publishedNewsResult,
          draftNewsResult,
          recentNewsResult,
          totalMessagesResult,
          newMessagesResult,
          recentMessagesResult
        ];


        const failedResult =
          results.find(
            (result) =>
              result.error
          );


        if (failedResult?.error) {
          throw failedResult.error;
        }


        /* 更新统计数字 */

        setDashboardText(
          totalNewsCountElement,
          String(
            totalNewsResult.count ?? 0
          )
        );

        setDashboardText(
          publishedNewsCountElement,
          String(
            publishedNewsResult.count ?? 0
          )
        );

        setDashboardText(
          draftNewsCountElement,
          String(
            draftNewsResult.count ?? 0
          )
        );

        setDashboardText(
          totalMessageCountElement,
          String(
            totalMessagesResult.count ?? 0
          )
        );

        setDashboardText(
          newMessageCountElement,
          String(
            newMessagesResult.count ?? 0
          )
        );


        /* 更新最近新闻 */

        renderDashboardRecentNews(
          Array.isArray(
            recentNewsResult.data
          )
            ? recentNewsResult.data
            : []
        );


        /* 更新最近留言 */

        renderDashboardRecentMessages(
          Array.isArray(
            recentMessagesResult.data
          )
            ? recentMessagesResult.data
            : []
        );


        /* 更新时间 */

        setDashboardText(
          updatedTimeElement,
          formatDashboardUpdateTime(
            new Date()
          )
        );


      } catch (error) {
        console.error(
          "控制台数据读取失败：",
          error
        );

        showDashboardGlobalError(
          getDashboardErrorMessage(
            error
          )
        );

      } finally {
        dashboardIsLoading = false;
        setDashboardRefreshState(false);
      }
    }


    /* =====================================
       渲染最近新闻
    ===================================== */

    function renderDashboardRecentNews(
      newsItems
    ) {
      if (!recentNewsList) {
        return;
      }


      if (newsItems.length === 0) {
        recentNewsList.innerHTML = `
          <div class="dashboard-empty-state">

            <span>▤</span>

            <h4>暂时没有新闻</h4>

            <p>
              创建新闻后，
              最近内容会显示在这里。
            </p>

          </div>
        `;

        return;
      }


      recentNewsList.innerHTML =
        newsItems
          .map(
            createDashboardNewsItem
          )
          .join("");


      recentNewsList
        .querySelectorAll(
          "[data-dashboard-news-panel]"
        )
        .forEach(
          (button) => {
            button.addEventListener(
              "click",
              () => {
                openDashboardPanel(
                  "newsPanel"
                );
              }
            );
          }
        );
    }


    function createDashboardNewsItem(
      newsItem
    ) {
      const categoryLabel =
        getDashboardNewsCategoryLabel(
          newsItem.category
        );

      const statusInformation =
        getDashboardNewsStatusInformation(
          newsItem.status
        );

      const displayDate =
        newsItem.updated_at ||
        newsItem.published_at ||
        newsItem.created_at;


      return `
        <button
          class="dashboard-recent-item"
          type="button"
          data-dashboard-news-panel
        >

          <div class="dashboard-recent-main">

            <div class="dashboard-recent-labels">

              <span>
                ${escapeDashboardHtml(
                  categoryLabel
                )}
              </span>

              <small class="${
                statusInformation.className
              }">
                ${escapeDashboardHtml(
                  statusInformation.label
                )}
              </small>

            </div>


            <strong>
              ${escapeDashboardHtml(
                newsItem.title
              )}
            </strong>


            <p>
              ${escapeDashboardHtml(
                newsItem.summary ||
                "暂时没有填写新闻摘要。"
              )}
            </p>

          </div>


          <div class="dashboard-recent-meta">

            <time>
              ${formatDashboardDate(
                displayDate
              )}
            </time>

            <span>→</span>

          </div>

        </button>
      `;
    }


    /* =====================================
       渲染最近客户留言
    ===================================== */

    function renderDashboardRecentMessages(
      messageItems
    ) {
      if (!recentMessageList) {
        return;
      }


      if (messageItems.length === 0) {
        recentMessageList.innerHTML = `
          <div class="dashboard-empty-state">

            <span>✉</span>

            <h4>暂时没有客户留言</h4>

            <p>
              网站访客提交联系信息后，
              会显示在这里。
            </p>

          </div>
        `;

        return;
      }


      recentMessageList.innerHTML =
        messageItems
          .map(
            createDashboardMessageItem
          )
          .join("");


      recentMessageList
        .querySelectorAll(
          "[data-dashboard-message-panel]"
        )
        .forEach(
          (button) => {
            button.addEventListener(
              "click",
              () => {
                openDashboardPanel(
                  "messagesPanel"
                );
              }
            );
          }
        );
    }


    function createDashboardMessageItem(
      messageItem
    ) {
      const serviceLabel =
        getDashboardServiceLabel(
          messageItem.service_type
        );

      const statusInformation =
        getDashboardMessageStatusInformation(
          messageItem.status
        );

      const companyText =
        messageItem.company ||
        "未填写公司";


      return `
        <button
          class="dashboard-recent-item"
          type="button"
          data-dashboard-message-panel
        >

          <div class="dashboard-recent-main">

            <div class="dashboard-recent-labels">

              <span>
                ${escapeDashboardHtml(
                  serviceLabel
                )}
              </span>

              <small class="${
                statusInformation.className
              }">
                ${escapeDashboardHtml(
                  statusInformation.label
                )}
              </small>

            </div>


            <strong>
              ${escapeDashboardHtml(
                messageItem.name
              )}
            </strong>


            <p>
              ${escapeDashboardHtml(
                companyText
              )}
              ·
              ${escapeDashboardHtml(
                messageItem.message
              )}
            </p>

          </div>


          <div class="dashboard-recent-meta">

            <time>
              ${formatDashboardDate(
                messageItem.created_at
              )}
            </time>

            <span>→</span>

          </div>

        </button>
      `;
    }


    /* =====================================
       切换后台面板
    ===================================== */

    function openDashboardPanel(
      panelId
    ) {
      const navigationButton =
        document.querySelector(
          `[data-admin-panel="${panelId}"]`
        );


      if (navigationButton) {
        navigationButton.click();
        return;
      }


      const openPanelButton =
        document.querySelector(
          `[data-open-panel="${panelId}"]`
        );


      openPanelButton?.click();
    }


    /* =====================================
       刷新控制台
    ===================================== */

    refreshButton?.addEventListener(
      "click",
      async () => {
        setDashboardRefreshState(true);
        await loadDashboardData();
      }
    );


    /*
     * 当用户重新打开控制台时，
     * 自动刷新数据。
     */
    const dashboardObserver =
      new MutationObserver(
        () => {
          if (
            dashboardPanel.classList
              .contains("active")
          ) {
            loadDashboardData();
          }
        }
      );


    dashboardObserver.observe(
      dashboardPanel,
      {
        attributes: true,
        attributeFilter: [
          "class"
        ]
      }
    );


    /* 首次读取 */

    await loadDashboardData();


    /* =====================================
       页面状态
    ===================================== */

    function setDashboardLoading() {
      setDashboardText(
        totalNewsCountElement,
        "—"
      );

      setDashboardText(
        publishedNewsCountElement,
        "—"
      );

      setDashboardText(
        draftNewsCountElement,
        "—"
      );

      setDashboardText(
        newMessageCountElement,
        "—"
      );

      setDashboardText(
        totalMessageCountElement,
        "—"
      );

      setDashboardText(
        updatedTimeElement,
        "正在读取……"
      );


      if (recentNewsList) {
        recentNewsList.innerHTML = `
          <div class="dashboard-list-loading">
            正在读取最近新闻……
          </div>
        `;
      }


      if (recentMessageList) {
        recentMessageList.innerHTML = `
          <div class="dashboard-list-loading">
            正在读取最近留言……
          </div>
        `;
      }
    }


    function showDashboardGlobalError(
      message
    ) {
      setDashboardText(
        totalNewsCountElement,
        "—"
      );

      setDashboardText(
        publishedNewsCountElement,
        "—"
      );

      setDashboardText(
        draftNewsCountElement,
        "—"
      );

      setDashboardText(
        newMessageCountElement,
        "—"
      );

      setDashboardText(
        totalMessageCountElement,
        "—"
      );

      setDashboardText(
        updatedTimeElement,
        "读取失败"
      );


      const errorHtml = `
        <div class="dashboard-error-state">

          <span>!</span>

          <h4>数据暂时无法读取</h4>

          <p>
            ${escapeDashboardHtml(
              message
            )}
          </p>

        </div>
      `;


      if (recentNewsList) {
        recentNewsList.innerHTML =
          errorHtml;
      }


      if (recentMessageList) {
        recentMessageList.innerHTML =
          errorHtml;
      }
    }


    function setDashboardRefreshState(
      isRefreshing
    ) {
      if (!refreshButton) {
        return;
      }

      refreshButton.disabled =
        isRefreshing;

      refreshButton.textContent =
        isRefreshing
          ? "正在刷新……"
          : "↻ 刷新控制台";
    }
  }
);


/* ========================================
   等待管理员验证完成
======================================== */

function waitForDashboardAdminReady() {
  return new Promise(
    (resolve) => {
      if (
        document.body.classList.contains(
          "admin-ready"
        )
      ) {
        resolve();
        return;
      }


      const observer =
        new MutationObserver(
          () => {
            if (
              document.body.classList
                .contains(
                  "admin-ready"
                )
            ) {
              observer.disconnect();
              resolve();
            }
          }
        );


      observer.observe(
        document.body,
        {
          attributes: true,
          attributeFilter: [
            "class"
          ]
        }
      );


      window.setTimeout(
        () => {
          observer.disconnect();
          resolve();
        },
        10000
      );
    }
  );
}


/* ========================================
   新闻分类
======================================== */

function getDashboardNewsCategoryLabel(
  category
) {
  const labels = {
    company: "公司新闻",
    industry: "行业新闻",
    media: "媒体报道"
  };


  return (
    labels[category] ||
    "新闻动态"
  );
}


/* ========================================
   新闻状态
======================================== */

function getDashboardNewsStatusInformation(
  status
) {
  if (status === "published") {
    return {
      label: "已发布",
      className: "dashboard-status-published"
    };
  }


  return {
    label: "草稿",
    className: "dashboard-status-draft"
  };
}


/* ========================================
   留言服务类型
======================================== */

function getDashboardServiceLabel(
  serviceType
) {
  const labels = {
    network:
      "企业网络",

    engineering:
      "通信工程",

    integration:
      "系统集成",

    enterprise:
      "大客户服务",

    support:
      "运维支持",

    cooperation:
      "商务合作",

    recruitment:
      "人才招聘",

    other:
      "其他咨询"
  };


  return (
    labels[serviceType] ||
    "其他咨询"
  );
}


/* ========================================
   留言状态
======================================== */

function getDashboardMessageStatusInformation(
  status
) {
  const labels = {
    new: {
      label: "新留言",
      className: "dashboard-status-new"
    },

    read: {
      label: "已查看",
      className: "dashboard-status-read"
    },

    contacted: {
      label: "已联系",
      className: "dashboard-status-contacted"
    },

    completed: {
      label: "已完成",
      className: "dashboard-status-completed"
    },

    archived: {
      label: "已归档",
      className: "dashboard-status-archived"
    }
  };


  return (
    labels[status] ||
    {
      label: "未知状态",
      className: "dashboard-status-unknown"
    }
  );
}


/* ========================================
   日期显示
======================================== */

function formatDashboardDate(
  value
) {
  if (!value) {
    return "日期未知";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "日期未知";
  }


  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  ).format(date);
}


function formatDashboardUpdateTime(
  date
) {
  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


/* ========================================
   设置文字
======================================== */

function setDashboardText(
  element,
  value
) {
  if (element) {
    element.textContent =
      value || "";
  }
}


/* ========================================
   错误信息
======================================== */

function getDashboardErrorMessage(
  error
) {
  const message =
    String(
      error?.message || ""
    ).toLowerCase();


  if (
    message.includes(
      "failed to fetch"
    )
  ) {
    return "无法连接数据服务器，请检查网络后重新刷新。";
  }


  if (
    message.includes(
      "permission denied"
    ) ||
    message.includes(
      "row-level security"
    )
  ) {
    return "管理员数据读取权限异常，请检查登录身份和安全策略。";
  }


  return (
    error?.message ||
    "控制台数据读取失败，请稍后重试。"
  );
}


/* ========================================
   HTML 安全处理
======================================== */

function escapeDashboardHtml(
  value
) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}