"use strict";

/*
 * 奥斯达通信新闻管理系统
 *
 * 功能：
 * 1. 读取全部新闻
 * 2. 新闻分类和状态筛选
 * 3. 保存新闻草稿
 * 4. 正式发布新闻
 * 5. 编辑已有新闻
 * 6. 删除新闻
 * 7. 更新后台新闻数量
 */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    /*
     * admin.js 会先验证当前用户是否为管理员。
     * 新闻系统必须等待管理员验证完成后再启动。
     */
    const administratorReady =
      await waitForAdministratorReady();

    if (!administratorReady) {
      console.warn(
        "新闻管理功能没有启动：管理员身份验证未完成。"
      );

      return;
    }

    const supabase =
      window.ostarSupabase;

    if (!supabase) {
      console.error(
        "新闻管理功能无法读取 Supabase 客户端。"
      );

      return;
    }


    /* =====================================
       新闻页面状态
    ===================================== */

    const state = {
      newsItems: [],
      currentFilter: "all"
    };


    /* =====================================
       获取页面元素
    ===================================== */

    const newsList =
      document.getElementById(
        "adminNewsList"
      );

    const newsEditorForm =
      document.getElementById(
        "newsEditorForm"
      );

    const editingNewsIdInput =
      document.getElementById(
        "editingNewsId"
      );

    const newsTitleInput =
      document.getElementById(
        "newsTitle"
      );

    const newsCategorySelect =
      document.getElementById(
        "newsCategory"
      );

    const newsSlugInput =
      document.getElementById(
        "newsSlug"
      );

    const newsCoverImageInput =
      document.getElementById(
        "newsCoverImage"
      );

    const newsSummaryInput =
      document.getElementById(
        "newsSummary"
      );

    const newsContentInput =
      document.getElementById(
        "newsContent"
      );

    const newsEditorHeading =
      document.getElementById(
        "newsEditorHeading"
      );

    const cancelEditButton =
      document.getElementById(
        "cancelEditButton"
      );

    const refreshNewsButton =
      document.getElementById(
        "refreshNewsButton"
      );

    const filterButtons =
      document.querySelectorAll(
        ".news-filter-button"
      );


    /*
     * 检查 HTML 是否已经正确修改。
     */
    if (
      !newsList ||
      !newsEditorForm ||
      !newsTitleInput ||
      !newsCategorySelect ||
      !newsSummaryInput ||
      !newsContentInput
    ) {
      console.error(
        "新闻管理页面元素不完整，请检查 admin.html。"
      );

      return;
    }


    /* =====================================
       从数据库读取全部新闻
    ===================================== */

    async function loadNews() {
      showNewsListLoading();

      try {
        const {
          data,
          error
        } =
          await supabase
            .from("news")
            .select(`
              id,
              title,
              slug,
              category,
              summary,
              content,
              cover_image_url,
              status,
              author_id,
              published_at,
              created_at,
              updated_at
            `)
            .order(
              "created_at",
              {
                ascending: false
              }
            );

        if (error) {
          throw error;
        }

        state.newsItems =
          Array.isArray(data)
            ? data
            : [];

        updateNewsCounters();
        renderNewsList();

      } catch (error) {
        console.error(
          "读取新闻失败：",
          error
        );

        showNewsListError(
          getNewsErrorMessage(error)
        );
      }
    }


    function showNewsListLoading() {
      newsList.innerHTML = `
        <div class="admin-list-loading">
          正在读取新闻数据……
        </div>
      `;
    }


    function showNewsListError(message) {
      newsList.innerHTML = `
        <div class="admin-list-error">

          <strong>
            无法读取新闻数据
          </strong>

          <p>
            ${escapeHtml(message)}
          </p>

        </div>
      `;
    }


    /* =====================================
       渲染新闻列表
    ===================================== */

    function renderNewsList() {
      const filteredNews =
        state.newsItems.filter(
          (newsItem) => {
            if (
              state.currentFilter ===
              "all"
            ) {
              return true;
            }

            if (
              state.currentFilter ===
                "draft" ||
              state.currentFilter ===
                "published"
            ) {
              return (
                newsItem.status ===
                state.currentFilter
              );
            }

            return (
              newsItem.category ===
              state.currentFilter
            );
          }
        );

      if (filteredNews.length === 0) {
        newsList.innerHTML = `
          <div class="admin-empty-state">

            <span>▤</span>

            <h3>
              暂时没有符合条件的新闻
            </h3>

            <p>
              点击“新增新闻”即可创建第一篇内容。
            </p>

          </div>
        `;

        return;
      }

      newsList.innerHTML =
        filteredNews
          .map(createNewsRowHtml)
          .join("");
    }


    function createNewsRowHtml(newsItem) {
      const categoryLabel =
        getCategoryLabel(
          newsItem.category
        );

      const statusLabel =
        newsItem.status ===
        "published"
          ? "已发布"
          : "草稿";

      const displayDate =
        newsItem.status ===
        "published"
          ? newsItem.published_at
          : newsItem.updated_at;

      const summary =
        newsItem.summary ||
        "该新闻暂时没有摘要。";

      return `
        <article
          class="admin-news-row"
          data-news-row="${newsItem.id}"
        >

          <div class="admin-news-row-main">

            <div class="admin-news-badges">

              <span
                class="
                  news-category-badge
                  category-${escapeHtml(
                    newsItem.category
                  )}
                "
              >
                ${escapeHtml(
                  categoryLabel
                )}
              </span>

              <span
                class="
                  news-status-badge
                  status-${escapeHtml(
                    newsItem.status
                  )}
                "
              >
                ${escapeHtml(
                  statusLabel
                )}
              </span>

            </div>

            <h3>
              ${escapeHtml(
                newsItem.title
              )}
            </h3>

            <p>
              ${escapeHtml(summary)}
            </p>

          </div>


          <div class="admin-news-row-meta">

            <span>
              新闻编号
            </span>

            <strong>
              #${newsItem.id}
            </strong>

            <span>
              最后更新时间
            </span>

            <strong>
              ${formatNewsDate(
                displayDate
              )}
            </strong>

          </div>


          <div class="admin-news-row-actions">

            <button
              class="news-edit-button"
              type="button"
              data-news-action="edit"
              data-news-id="${newsItem.id}"
            >
              编辑
            </button>

            <button
              class="news-delete-button"
              type="button"
              data-news-action="delete"
              data-news-id="${newsItem.id}"
            >
              删除
            </button>

          </div>

        </article>
      `;
    }


    /* =====================================
       保存草稿或正式发布
    ===================================== */

    newsEditorForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        /*
         * 判断用户点击的是：
         * 保存草稿，还是正式发布。
         */
        const clickedButton =
          event.submitter;

        const saveStatus =
          clickedButton
            ?.dataset
            .saveStatus ||
          "draft";

        resetEditorMessage();

        const title =
          newsTitleInput
            .value
            .trim();

        const category =
          newsCategorySelect.value;

        const summary =
          newsSummaryInput
            .value
            .trim();

        const content =
          newsContentInput
            .value
            .trim();

        const coverImageUrl =
          newsCoverImageInput
            ?.value
            .trim() || "";

        let slug =
          newsSlugInput
            ?.value
            .trim()
            .toLowerCase() || "";


        /*
         * 检查必填内容。
         */
        if (!title) {
          showEditorMessage(
            "请输入新闻标题。",
            "error"
          );

          newsTitleInput.focus();
          return;
        }

        if (!category) {
          showEditorMessage(
            "请选择新闻分类。",
            "error"
          );

          newsCategorySelect.focus();
          return;
        }

        if (!summary) {
          showEditorMessage(
            "请输入新闻摘要。",
            "error"
          );

          newsSummaryInput.focus();
          return;
        }

        if (!content) {
          showEditorMessage(
            "请输入新闻正文。",
            "error"
          );

          newsContentInput.focus();
          return;
        }


        /*
         * 用户没有填写 slug 时自动生成。
         */
        if (!slug) {
          slug =
            createNewsSlug(title);

          if (newsSlugInput) {
            newsSlugInput.value =
              slug;
          }
        }


        /*
         * 整理准备写入数据库的数据。
         */
        const newsPayload = {
          title,
          slug,
          category,
          summary,
          content,

          cover_image_url:
            coverImageUrl || null,

          status: saveStatus
        };


        /*
         * editingNewsId 有值时代表编辑；
         * 没有值代表新建新闻。
         */
        const editingNewsId =
          Number(
            editingNewsIdInput
              ?.value
          ) || null;

        setEditorBusy(true);

        try {
          if (editingNewsId) {
            await updateNews(
              editingNewsId,
              newsPayload
            );
          } else {
            await createNews(
              newsPayload
            );
          }

          showEditorMessage(
            saveStatus ===
            "published"
              ? "新闻已经正式发布。"
              : "新闻草稿已经保存。",
            "success"
          );

          /*
           * 保存后清空表单。
           * false 表示暂时保留成功提示。
           */
          resetNewsEditor(false);

          await loadNews();

          /*
           * 短暂显示成功消息后，
           * 自动跳转到新闻管理列表。
           */
          window.setTimeout(
            () => {
              openNewsManagementPanel();
            },
            800
          );

        } catch (error) {
          console.error(
            "保存新闻失败：",
            error
          );

          showEditorMessage(
            getNewsErrorMessage(error),
            "error"
          );

        } finally {
          setEditorBusy(false);
        }
      }
    );


    async function createNews(
      newsPayload
    ) {
      const {
        error
      } =
        await supabase
          .from("news")
          .insert(newsPayload);

      if (error) {
        throw error;
      }
    }


    async function updateNews(
      newsId,
      newsPayload
    ) {
      const {
        error
      } =
        await supabase
          .from("news")
          .update(newsPayload)
          .eq(
            "id",
            newsId
          );

      if (error) {
        throw error;
      }
    }


    /* =====================================
       新闻列表中的编辑和删除按钮
    ===================================== */

    newsList.addEventListener(
      "click",
      async (event) => {
        const actionButton =
          event.target.closest(
            "[data-news-action]"
          );

        if (!actionButton) {
          return;
        }

        const newsId =
          Number(
            actionButton
              .dataset
              .newsId
          );

        const action =
          actionButton
            .dataset
            .newsAction;

        if (!newsId) {
          return;
        }

        if (action === "edit") {
          startEditingNews(newsId);
          return;
        }

        if (action === "delete") {
          await deleteNews(
            newsId,
            actionButton
          );
        }
      }
    );


    /* =====================================
       开始编辑新闻
    ===================================== */

    function startEditingNews(newsId) {
      const newsItem =
        state.newsItems.find(
          (item) =>
            item.id === newsId
        );

      if (!newsItem) {
        window.alert(
          "找不到需要编辑的新闻。"
        );

        return;
      }

      editingNewsIdInput.value =
        String(newsItem.id);

      newsTitleInput.value =
        newsItem.title || "";

      newsCategorySelect.value =
        newsItem.category ||
        "company";

      if (newsSlugInput) {
        newsSlugInput.value =
          newsItem.slug || "";
      }

      if (newsCoverImageInput) {
        newsCoverImageInput.value =
          newsItem
            .cover_image_url || "";
      }

      newsSummaryInput.value =
        newsItem.summary || "";

      newsContentInput.value =
        newsItem.content || "";

      if (newsEditorHeading) {
        newsEditorHeading.textContent =
          `编辑新闻 #${newsItem.id}`;
      }

      if (cancelEditButton) {
        cancelEditButton.hidden =
          false;
      }

      resetEditorMessage();

      /*
       * 切换到新增新闻页面，
       * 但此时表单处于编辑模式。
       */
      document
        .querySelector(
          '[data-admin-panel="createNewsPanel"]'
        )
        ?.click();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }


    /* =====================================
       删除新闻
    ===================================== */

    async function deleteNews(
      newsId,
      deleteButton
    ) {
      const newsItem =
        state.newsItems.find(
          (item) =>
            item.id === newsId
        );

      if (!newsItem) {
        return;
      }

      const confirmed =
        window.confirm(
          `确定删除新闻《${newsItem.title}》吗？\n\n删除后不能恢复。`
        );

      if (!confirmed) {
        return;
      }

      const originalText =
        deleteButton.textContent;

      deleteButton.disabled =
        true;

      deleteButton.textContent =
        "删除中……";

      try {
        const {
          error
        } =
          await supabase
            .from("news")
            .delete()
            .eq(
              "id",
              newsId
            );

        if (error) {
          throw error;
        }

        /*
         * 正在编辑的新闻被删除时，
         * 同时清空编辑表单。
         */
        if (
          Number(
            editingNewsIdInput
              ?.value
          ) === newsId
        ) {
          resetNewsEditor();
        }

        await loadNews();

      } catch (error) {
        console.error(
          "删除新闻失败：",
          error
        );

        window.alert(
          getNewsErrorMessage(error)
        );

        deleteButton.disabled =
          false;

        deleteButton.textContent =
          originalText;
      }
    }


    /* =====================================
       取消新闻编辑
    ===================================== */

    cancelEditButton
      ?.addEventListener(
        "click",
        () => {
          resetNewsEditor();
          openNewsManagementPanel();
        }
      );


    function resetNewsEditor(
      clearMessage = true
    ) {
      newsEditorForm.reset();

      if (editingNewsIdInput) {
        editingNewsIdInput.value =
          "";
      }

      newsCategorySelect.value =
        "company";

      if (newsEditorHeading) {
        newsEditorHeading.textContent =
          "创建一篇新新闻";
      }

      if (cancelEditButton) {
        cancelEditButton.hidden =
          true;
      }

      if (clearMessage) {
        resetEditorMessage();
      }
    }


    /* =====================================
       新闻筛选功能
    ===================================== */

    filterButtons.forEach(
      (filterButton) => {
        filterButton.addEventListener(
          "click",
          () => {
            filterButtons.forEach(
              (button) => {
                button.classList.remove(
                  "active"
                );
              }
            );

            filterButton.classList.add(
              "active"
            );

            state.currentFilter =
              filterButton
                .dataset
                .newsFilter ||
              "all";

            renderNewsList();
          }
        );
      }
    );


    /* =====================================
       刷新新闻列表
    ===================================== */

    refreshNewsButton
      ?.addEventListener(
        "click",
        async () => {
          refreshNewsButton.disabled =
            true;

          refreshNewsButton.textContent =
            "正在刷新……";

          await loadNews();

          refreshNewsButton.disabled =
            false;

          refreshNewsButton.textContent =
            "↻ 刷新列表";
        }
      );


    /* =====================================
       更新控制台数字
    ===================================== */

    function updateNewsCounters() {
      const totalNews =
        state.newsItems.length;

      const publishedNews =
        state.newsItems.filter(
          (newsItem) =>
            newsItem.status ===
            "published"
        ).length;

      setCounterText(
        "totalNewsCount",
        totalNews
      );

      setCounterText(
        "publishedNewsCount",
        publishedNews
      );

      setCounterText(
        "sidebarNewsCount",
        totalNews
      );
    }


    function openNewsManagementPanel() {
      document
        .querySelector(
          '[data-admin-panel="newsPanel"]'
        )
        ?.click();
    }


    /* =====================================
       第一次载入新闻
    ===================================== */

    await loadNews();
  }
);


/* ========================================
   等待 admin.js 完成身份验证
======================================== */

async function waitForAdministratorReady(
  timeout = 12000
) {
  const startTime =
    Date.now();

  while (
    Date.now() - startTime <
    timeout
  ) {
    if (
      document.body.classList.contains(
        "admin-ready"
      )
    ) {
      return true;
    }

    await delay(100);
  }

  return false;
}


/* ========================================
   自动生成新闻 slug
======================================== */

function createNewsSlug(title) {
  /*
   * 英文标题可以直接生成英文 slug。
   */
  const englishSlug =
    title
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(0, 70);

  if (englishSlug) {
    return englishSlug;
  }

  /*
   * 中文标题使用时间戳和随机数，
   * 防止多篇新闻 slug 重复。
   */
  const date =
    new Date();

  const datePart = [
    date.getFullYear(),

    String(
      date.getMonth() + 1
    ).padStart(2, "0"),

    String(
      date.getDate()
    ).padStart(2, "0"),

    String(
      date.getHours()
    ).padStart(2, "0"),

    String(
      date.getMinutes()
    ).padStart(2, "0"),

    String(
      date.getSeconds()
    ).padStart(2, "0")
  ].join("");

  const randomPart =
    Math.random()
      .toString(36)
      .slice(2, 8);

  return (
    `news-${datePart}-${randomPart}`
  );
}


/* ========================================
   新闻分类文字
======================================== */

function getCategoryLabel(category) {
  const categoryLabels = {
    company: "公司新闻",
    industry: "行业新闻",
    media: "媒体报道"
  };

  return (
    categoryLabels[category] ||
    "其他新闻"
  );
}


/* ========================================
   日期格式
======================================== */

function formatNewsDate(value) {
  if (!value) {
    return "尚未发布";
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
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


/* ========================================
   编辑器按钮状态
======================================== */

function setEditorBusy(busy) {
  const saveButtons =
    document.querySelectorAll(
      ".news-save-button"
    );

  saveButtons.forEach(
    (button) => {
      button.disabled = busy;
    }
  );

  const cancelButton =
    document.getElementById(
      "cancelEditButton"
    );

  if (cancelButton) {
    cancelButton.disabled =
      busy;
  }
}


/* ========================================
   编辑器提示消息
======================================== */

function showEditorMessage(
  message,
  type
) {
  const messageElement =
    document.getElementById(
      "newsEditorMessage"
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent =
    message;

  messageElement.classList.remove(
    "success",
    "error"
  );

  messageElement.classList.add(
    type
  );
}


function resetEditorMessage() {
  const messageElement =
    document.getElementById(
      "newsEditorMessage"
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent =
    "";

  messageElement.classList.remove(
    "success",
    "error"
  );
}


/* ========================================
   更新数字
======================================== */

function setCounterText(
  elementId,
  value
) {
  const element =
    document.getElementById(
      elementId
    );

  if (element) {
    element.textContent =
      String(value);
  }
}


/* ========================================
   错误信息转换
======================================== */

function getNewsErrorMessage(error) {
  const message =
    String(
      error?.message || ""
    ).toLowerCase();

  const code =
    String(
      error?.code || ""
    );

  if (
    code === "23505" ||
    message.includes(
      "duplicate key"
    )
  ) {
    return "新闻地址标识已经存在，请填写另一个地址标识。";
  }

  if (
    code === "42501" ||
    message.includes(
      "row-level security"
    ) ||
    message.includes(
      "permission denied"
    )
  ) {
    return "当前账号没有新闻管理权限，请重新登录管理员账号。";
  }

  if (
    message.includes(
      "failed to fetch"
    )
  ) {
    return "无法连接新闻数据库，请检查网络后重试。";
  }

  return (
    error?.message ||
    "新闻操作失败，请稍后重试。"
  );
}


/* ========================================
   防止新闻内容被当作 HTML 执行
======================================== */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* ========================================
   延时工具
======================================== */

function delay(milliseconds) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}