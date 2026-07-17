"use strict";

/*
 * 首页最新新闻
 * 从 Supabase 读取最新发布的三篇新闻。
 */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const supabase =
      window.ostarSupabase;

    const newsGrid =
      document.getElementById(
        "homeNewsGrid"
      );

    if (!newsGrid) {
      return;
    }

    if (!supabase) {
      showHomeNewsError(
        newsGrid,
        "新闻服务没有成功连接。"
      );

      return;
    }

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
            cover_image_url,
            published_at
          `)
          .eq(
            "status",
            "published"
          )
          .order(
            "published_at",
            {
              ascending: false
            }
          )
          .limit(3);

      if (error) {
        throw error;
      }

      const newsItems =
        Array.isArray(data)
          ? data
          : [];

      if (newsItems.length === 0) {
        showHomeNewsEmpty(newsGrid);
        return;
      }

      renderHomeNews(
        newsGrid,
        newsItems
      );

    } catch (error) {
      console.error(
        "首页新闻读取失败：",
        error
      );

      showHomeNewsError(
        newsGrid,
        getHomeNewsErrorMessage(error)
      );
    }
  }
);


/* ========================================
   生成首页新闻区域
======================================== */

function renderHomeNews(
  newsGrid,
  newsItems
) {
  const featuredNews =
    newsItems[0];

  const sideNews =
    newsItems.slice(1, 3);

  newsGrid.innerHTML = `
    ${createFeaturedNewsHtml(
      featuredNews
    )}

    <div class="news-list">

      ${
        sideNews.length > 0
          ? sideNews
              .map(
                (
                  newsItem,
                  index
                ) =>
                  createSideNewsHtml(
                    newsItem,
                    index
                  )
              )
              .join("")
          : createSideNewsEmptyHtml()
      }

    </div>
  `;
}


/* ========================================
   左侧主要新闻
======================================== */

function createFeaturedNewsHtml(
  newsItem
) {
  const detailUrl =
    createHomeNewsDetailUrl(
      newsItem.slug
    );

  const categoryLabel =
    getHomeCategoryLabel(
      newsItem.category
    );

  const categoryEnglish =
    getHomeCategoryEnglish(
      newsItem.category
    );

  const imageUrl =
    getHomeSafeImageUrl(
      newsItem.cover_image_url
    );

  const imageHtml =
    imageUrl
      ? `
        <img
          src="${escapeHomeNewsHtml(
            imageUrl
          )}"
          alt="${escapeHomeNewsHtml(
            newsItem.title
          )}"
          loading="lazy"
        >
      `
      : `
        <div class="news-image-decoration">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;

  return `
    <article class="featured-news-card">

      <a
        class="featured-news-image"
        href="${detailUrl}"
      >

        ${imageHtml}

        <span class="news-image-label">
          ${escapeHomeNewsHtml(
            categoryEnglish
          )}
        </span>

      </a>


      <div class="featured-news-content">

        <div class="news-meta">

          <span>
            ${escapeHomeNewsHtml(
              categoryLabel
            )}
          </span>

          <time>
            ${formatHomeNewsDate(
              newsItem.published_at
            )}
          </time>

        </div>


        <h3>
          <a href="${detailUrl}">
            ${escapeHomeNewsHtml(
              newsItem.title
            )}
          </a>
        </h3>


        <p>
          ${escapeHomeNewsHtml(
            newsItem.summary
          )}
        </p>


        <a href="${detailUrl}">
          阅读新闻详情
          <span>→</span>
        </a>

      </div>

    </article>
  `;
}


/* ========================================
   右侧新闻卡片
======================================== */

function createSideNewsHtml(
  newsItem,
  index
) {
  const detailUrl =
    createHomeNewsDetailUrl(
      newsItem.slug
    );

  const categoryLabel =
    getHomeCategoryLabel(
      newsItem.category
    );

  const displayNumber =
    String(index + 1)
      .padStart(2, "0");

  return `
    <article class="news-list-card">

      <div class="news-list-number">
        ${displayNumber}
      </div>


      <div class="news-list-content">

        <div class="news-meta">

          <span>
            ${escapeHomeNewsHtml(
              categoryLabel
            )}
          </span>

          <time>
            ${formatHomeNewsDate(
              newsItem.published_at
            )}
          </time>

        </div>


        <h3>
          <a href="${detailUrl}">
            ${escapeHomeNewsHtml(
              newsItem.title
            )}
          </a>
        </h3>


        <p>
          ${escapeHomeNewsHtml(
            newsItem.summary
          )}
        </p>


        <a href="${detailUrl}">
          查看详情
          <span>→</span>
        </a>

      </div>

    </article>
  `;
}


/* ========================================
   只有一篇新闻时的右侧区域
======================================== */

function createSideNewsEmptyHtml() {
  return `
    <div class="home-news-side-empty">

      <span>NEWS</span>

      <strong>
        更多新闻正在整理中
      </strong>

      <p>
        管理员发布新的新闻后，
        内容会自动显示在这里。
      </p>

      <a href="news.html">
        查看新闻中心 →
      </a>

    </div>
  `;
}


/* ========================================
   空状态
======================================== */

function showHomeNewsEmpty(
  newsGrid
) {
  newsGrid.innerHTML = `
    <div class="home-news-empty">

      <span>▤</span>

      <h3>
        暂时没有已发布新闻
      </h3>

      <p>
        管理员发布新闻后，
        最新内容会自动显示在首页。
      </p>

    </div>
  `;
}


/* ========================================
   错误状态
======================================== */

function showHomeNewsError(
  newsGrid,
  message
) {
  newsGrid.innerHTML = `
    <div class="home-news-error">

      <span>!</span>

      <h3>
        新闻内容暂时无法加载
      </h3>

      <p>
        ${escapeHomeNewsHtml(message)}
      </p>

    </div>
  `;
}


/* ========================================
   创建详情页地址
======================================== */

function createHomeNewsDetailUrl(
  slug
) {
  return (
    "news-detail.html?slug=" +
    encodeURIComponent(slug)
  );
}


/* ========================================
   新闻分类名称
======================================== */

function getHomeCategoryLabel(
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


function getHomeCategoryEnglish(
  category
) {
  const labels = {
    company: "COMPANY NEWS",
    industry: "INDUSTRY NEWS",
    media: "MEDIA REPORTS"
  };

  return (
    labels[category] ||
    "OSTAR NEWS"
  );
}


/* ========================================
   日期格式
======================================== */

function formatHomeNewsDate(
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

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}.${month}.${day}`;
}


/* ========================================
   封面图片地址检查
======================================== */

function getHomeSafeImageUrl(
  value
) {
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

function getHomeNewsErrorMessage(
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
    return "新闻读取权限配置异常。";
  }

  return (
    error?.message ||
    "请稍后重新刷新首页。"
  );
}


/* ========================================
   HTML 安全处理
======================================== */

function escapeHomeNewsHtml(
  value
) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}