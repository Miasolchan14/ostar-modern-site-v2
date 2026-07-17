"use strict";

/*
 * 奥斯达通信动态新闻详情页
 *
 * 根据网址中的 slug 查询一篇已发布新闻。
 */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const supabase =
      window.ostarSupabase;

    const statusElement =
      document.getElementById(
        "newsDetailStatus"
      );

    const articleElement =
      document.getElementById(
        "newsDetailArticle"
      );

    if (
      !statusElement ||
      !articleElement
    ) {
      return;
    }

    if (!supabase) {
      showDetailError(
        statusElement,
        "新闻服务没有成功连接，请稍后刷新页面。"
      );

      return;
    }


    /*
     * 从网址读取 slug：
     * news-detail.html?slug=xxxxx
     */
    const searchParameters =
      new URLSearchParams(
        window.location.search
      );

    const slug =
      searchParameters
        .get("slug")
        ?.trim();


    if (!slug) {
      showDetailError(
        statusElement,
        "新闻地址不完整，请返回新闻中心重新选择新闻。"
      );

      return;
    }


    try {
      /*
       * 必须同时限制：
       * 1. slug 与网址一致
       * 2. 状态为 published
       *
       * 即使管理员保持登录，
       * 详情页也不会显示草稿。
       */
      const {
        data: newsItem,
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
            published_at,
            created_at,
            updated_at
          `)
          .eq(
            "slug",
            slug
          )
          .eq(
            "status",
            "published"
          )
          .maybeSingle();


      if (error) {
        throw error;
      }


      if (!newsItem) {
        showDetailNotFound(
          statusElement
        );

        return;
      }


      renderNewsDetail(
        newsItem
      );

      statusElement.hidden = true;
      articleElement.hidden = false;


    } catch (error) {
      console.error(
        "新闻详情读取失败：",
        error
      );

      showDetailError(
        statusElement,
        getDetailErrorMessage(error)
      );
    }
  }
);


/* ========================================
   显示新闻详情
======================================== */

function renderNewsDetail(newsItem) {
  const categoryLabel =
    getDetailCategoryLabel(
      newsItem.category
    );

  const formattedDate =
    formatDetailDate(
      newsItem.published_at ||
      newsItem.created_at
    );


  setDetailText(
    "detailCategory",
    categoryLabel
  );

  setDetailText(
    "detailBreadcrumbCategory",
    categoryLabel
  );

  setDetailText(
    "detailSideCategory",
    categoryLabel
  );

  setDetailText(
    "detailDate",
    formattedDate
  );

  setDetailText(
    "detailSideDate",
    formattedDate
  );

  setDetailText(
    "detailTitle",
    newsItem.title
  );

  setDetailText(
    "detailSummary",
    newsItem.summary
  );


  /*
   * 修改浏览器标签标题。
   */
  document.title =
    `${newsItem.title}｜奥斯达通信`;


  renderDetailContent(
    newsItem.content
  );

  renderDetailCover(
    newsItem.cover_image_url,
    newsItem.title
  );

  setupCopyNewsLink();
}


/* ========================================
   渲染正文
======================================== */

function renderDetailContent(content) {
  const contentElement =
    document.getElementById(
      "detailContent"
    );

  if (!contentElement) {
    return;
  }

  contentElement.textContent = "";

  /*
   * 两个换行之间视为一个段落。
   */
  const paragraphs =
    String(content || "")
      .split(/\n\s*\n/)
      .map((paragraph) =>
        paragraph.trim()
      )
      .filter(Boolean);


  if (paragraphs.length === 0) {
    const emptyParagraph =
      document.createElement("p");

    emptyParagraph.textContent =
      "该新闻暂时没有正文内容。";

    contentElement.appendChild(
      emptyParagraph
    );

    return;
  }


  paragraphs.forEach(
    (paragraphText) => {
      const paragraph =
        document.createElement("p");

      /*
       * 单个换行转换成 br，
       * 同时继续使用 textContent，
       * 避免数据库内容被执行成 HTML。
       */
      const lines =
        paragraphText.split("\n");

      lines.forEach(
        (line, index) => {
          if (index > 0) {
            paragraph.appendChild(
              document.createElement("br")
            );
          }

          paragraph.appendChild(
            document.createTextNode(line)
          );
        }
      );

      contentElement.appendChild(
        paragraph
      );
    }
  );
}


/* ========================================
   渲染封面图片
======================================== */

function renderDetailCover(
  imageUrl,
  title
) {
  const wrapper =
    document.getElementById(
      "detailCoverWrapper"
    );

  const image =
    document.getElementById(
      "detailCoverImage"
    );

  if (!wrapper || !image) {
    return;
  }

  const safeUrl =
    getDetailSafeImageUrl(
      imageUrl
    );

  if (!safeUrl) {
    wrapper.hidden = true;
    return;
  }

  image.src = safeUrl;
  image.alt = title || "新闻封面";

  image.addEventListener(
    "error",
    () => {
      wrapper.hidden = true;
    },
    {
      once: true
    }
  );

  wrapper.hidden = false;
}


/* ========================================
   复制新闻链接
======================================== */

function setupCopyNewsLink() {
  const button =
    document.getElementById(
      "copyNewsLinkButton"
    );

  const message =
    document.getElementById(
      "copyNewsLinkMessage"
    );

  button?.addEventListener(
    "click",
    async () => {
      try {
        await navigator.clipboard.writeText(
          window.location.href
        );

        if (message) {
          message.textContent =
            "新闻链接已复制。";

          message.className =
            "detail-copy-message success";
        }

      } catch {
        /*
         * 浏览器不支持剪贴板权限时，
         * 使用旧式复制方法。
         */
        const temporaryInput =
          document.createElement(
            "textarea"
          );

        temporaryInput.value =
          window.location.href;

        temporaryInput.style.position =
          "fixed";

        temporaryInput.style.opacity =
          "0";

        document.body.appendChild(
          temporaryInput
        );

        temporaryInput.select();

        document.execCommand("copy");

        temporaryInput.remove();

        if (message) {
          message.textContent =
            "新闻链接已复制。";

          message.className =
            "detail-copy-message success";
        }
      }
    }
  );
}


/* ========================================
   新闻不存在
======================================== */

function showDetailNotFound(element) {
  element.hidden = false;
  element.className =
    "news-detail-status news-detail-not-found";

  element.innerHTML = `
    <div class="news-detail-state-icon">
      ?
    </div>

    <h1>
      找不到这篇新闻
    </h1>

    <p>
      新闻可能尚未发布、已经删除，
      或新闻地址不正确。
    </p>

    <a href="news.html">
      返回新闻中心
      <span>→</span>
    </a>
  `;
}


/* ========================================
   新闻读取错误
======================================== */

function showDetailError(
  element,
  message
) {
  element.hidden = false;
  element.className =
    "news-detail-status news-detail-error";

  element.innerHTML = `
    <div class="news-detail-state-icon">
      !
    </div>

    <h1>
      新闻内容暂时无法加载
    </h1>

    <p>
      ${escapeDetailHtml(message)}
    </p>

    <a href="news.html">
      返回新闻中心
      <span>→</span>
    </a>
  `;
}


/* ========================================
   分类名称
======================================== */

function getDetailCategoryLabel(
  category
) {
  const categoryLabels = {
    company: "公司新闻",
    industry: "行业新闻",
    media: "媒体报道"
  };

  return (
    categoryLabels[category] ||
    "新闻动态"
  );
}


/* ========================================
   日期格式
======================================== */

function formatDetailDate(value) {
  if (!value) {
    return "发布日期未知";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "发布日期未知";
  }

  return new Intl.DateTimeFormat(
    "zh-CN",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  ).format(date);
}


/* ========================================
   图片地址安全检查
======================================== */

function getDetailSafeImageUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url =
      new URL(
        value,
        window.location.href
      );

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return "";
    }

    return url.href;

  } catch {
    return "";
  }
}


/* ========================================
   错误信息
======================================== */

function getDetailErrorMessage(error) {
  const message =
    String(
      error?.message || ""
    ).toLowerCase();

  if (
    message.includes(
      "failed to fetch"
    )
  ) {
    return "无法连接新闻服务器，请检查网络后刷新页面。";
  }

  if (
    message.includes(
      "permission denied"
    ) ||
    message.includes(
      "row-level security"
    )
  ) {
    return "新闻读取权限配置异常，请联系管理员。";
  }

  return (
    error?.message ||
    "请稍后重新刷新新闻页面。"
  );
}


/* ========================================
   设置元素文字
======================================== */

function setDetailText(
  elementId,
  value
) {
  const element =
    document.getElementById(
      elementId
    );

  if (element) {
    element.textContent =
      value || "";
  }
}


/* ========================================
   HTML 字符安全转换
======================================== */

function escapeDetailHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}