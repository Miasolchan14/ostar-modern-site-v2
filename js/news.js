"use strict";

/*
 * 奥斯达通信前台新闻系统
 *
 * 目前功能：
 * 1. 从 Supabase 读取已发布新闻
 * 2. 按发布时间从新到旧排列
 * 3. 生成新闻卡片
 * 4. 跳转到新闻详情页
 * 5. 保证草稿不会在前台显示
 */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const supabase =
      window.ostarSupabase;

    const newsList =
      document.getElementById(
        "publicNewsList"
      );

    const newsStatus =
      document.getElementById(
        "publicNewsStatus"
      );

    /*
     * 当前页面没有新闻列表容器时，
     * 不执行列表加载。
     */
    if (!newsList) {
      return;
    }

    if (!supabase) {
      showPublicNewsError(
        newsStatus,
        "新闻服务没有成功连接，请稍后刷新页面。"
      );

      return;
    }


    /*
     * 从 body 读取新闻分类。
     *
     * news.html 使用 all。
     * 后续三个分类页分别使用：
     * company、industry、media。
     */
    const pageCategory =
      document.body.dataset
        .newsCategory || "all";


    try {
      let query =
        supabase
          .from("news")
          .select(`
            id,
            title,
            slug,
            category,
            summary,
            cover_image_url,
            published_at,
            created_at
          `)
          /*
           * 前台必须明确限制为 published，
           * 即使当前浏览器登录了管理员账号，
           * 也不能把草稿显示出来。
           */
          .eq(
            "status",
            "published"
          )
          .order(
            "published_at",
            {
              ascending: false
            }
          );


      /*
       * 分类页只查询指定分类。
       */
      if (pageCategory !== "all") {
        query =
          query.eq(
            "category",
            pageCategory
          );
      }


      const {
        data,
        error
      } = await query;


      if (error) {
        throw error;
      }


      const newsItems =
        Array.isArray(data)
          ? data
          : [];


      if (newsItems.length === 0) {
        newsStatus.className =
          "public-news-empty";

        newsStatus.innerHTML = `
          <span>▤</span>

          <h3>
            暂时没有已发布新闻
          </h3>

          <p>
            管理员发布新闻后，
            内容会自动显示在这里。
          </p>
        `;

        newsList.innerHTML = "";

        return;
      }


      /*
       * 有新闻时隐藏读取状态，
       * 显示新闻卡片。
       */
      newsStatus.hidden = true;

      newsList.innerHTML =
        newsItems
          .map(createPublicNewsCard)
          .join("");


    } catch (error) {
      console.error(
        "前台新闻读取失败：",
        error
      );

      showPublicNewsError(
        newsStatus,
        getPublicNewsErrorMessage(error)
      );
    }
  }
);


/* ========================================
   创建新闻卡片
======================================== */

function createPublicNewsCard(
  newsItem
) {
  const categoryLabel =
    getPublicCategoryLabel(
      newsItem.category
    );

  const safeImageUrl =
    getSafeImageUrl(
      newsItem.cover_image_url
    );

  const imageContent =
    safeImageUrl
      ? `
        <img
          src="${escapePublicHtml(
            safeImageUrl
          )}"
          alt="${escapePublicHtml(
            newsItem.title
          )}"
          loading="lazy"
        >
      `
      : `
        <div class="news-card-placeholder">

          <span>
            ${escapePublicHtml(
              categoryLabel
            )}
          </span>

          <strong>
            OSTAR
          </strong>

          <i></i>
          <i></i>
          <i></i>

        </div>
      `;


  const detailAddress =
    `news-detail.html?slug=${
      encodeURIComponent(
        newsItem.slug
      )
    }`;


  return `
    <article class="public-news-card">

      <a
        class="public-news-cover"
        href="${detailAddress}"
      >
        ${imageContent}
      </a>


      <div class="public-news-card-content">

        <div class="public-news-meta">

          <span>
            ${escapePublicHtml(
              categoryLabel
            )}
          </span>

          <time>
            ${formatPublicNewsDate(
              newsItem.published_at
            )}
          </time>

        </div>


        <h3>

          <a href="${detailAddress}">
            ${escapePublicHtml(
              newsItem.title
            )}
          </a>

        </h3>


        <p>
          ${escapePublicHtml(
            newsItem.summary
          )}
        </p>


        <a
          class="public-news-read-link"
          href="${detailAddress}"
        >
          阅读新闻详情
          <span>→</span>
        </a>

      </div>

    </article>
  `;
}


/* ========================================
   新闻分类名称
======================================== */

function getPublicCategoryLabel(
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
   新闻日期
======================================== */

function formatPublicNewsDate(
  value
) {
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
      day: "2-digit"
    }
  ).format(date);
}


/* ========================================
   安全处理封面网址
======================================== */

function getSafeImageUrl(value) {
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
   显示错误
======================================== */

function showPublicNewsError(
  element,
  message
) {
  if (!element) {
    return;
  }

  element.hidden = false;
  element.className =
    "public-news-error";

  element.innerHTML = `
    <span>!</span>

    <h3>
      新闻内容暂时无法加载
    </h3>

    <p>
      ${escapePublicHtml(message)}
    </p>
  `;
}


function getPublicNewsErrorMessage(
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
   防止数据库内容插入 HTML
======================================== */

function escapePublicHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}