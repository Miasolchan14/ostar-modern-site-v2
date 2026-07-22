"use strict";

/*
 * 奥斯达通信全站搜索
 *
 * 功能：
 * 1. 点击“搜索”按钮或按 Enter 开始搜索
 * 2. 搜索到相关栏目时直接跳转
 * 3. 没有结果时跳转到 search-empty.html
 * 4. 未输入关键词时显示明确提示页面
 */

document.addEventListener("DOMContentLoaded", () => {
  const searchInput =
    document.getElementById("siteSearchInput");

  const searchButton =
    document.getElementById("siteSearchButton");

  /*
   * 当前页面没有搜索框时停止执行，
   * 避免其他页面出现 JavaScript 报错。
   */
  if (!searchInput || !searchButton) {
    return;
  }


  /*
   * 网站搜索索引。
   * 每个关键词对应一个网站页面或栏目。
   */
  const searchIndex = [
    {
      url: "index.html",
      keywords: [
        "首页",
        "主页",
        "网站首页",
        "奥斯达",
        "奥斯达通信"
      ]
    },

    {
      url: "about.html#company",
      keywords: [
        "关于我们",
        "公司介绍",
        "企业文化",
        "公司简介",
        "公司发展",
        "企业使命",
        "企业愿景",
        "核心价值"
      ]
    },

    {
      url: "about.html#honors",
      keywords: [
        "荣誉资质",
        "资质",
        "荣誉",
        "证书",
        "许可证",
        "电信业务许可证",
        "增值电信业务许可证",
        "全国增值电信业务许可证",
        "省级增值电信业务许可证",
        "高新技术企业",
        "创新型企业",
        "版权登记",
        "业务许可",
        "isp资质",
        "idc资质",
        "ip-vpn资质"
      ]
    },

    {
      url: "about.html#careers",
      keywords: [
        "人才招聘",
        "招聘",
        "职位",
        "岗位",
        "应聘",
        "加入我们",
        "行政助理",
        "司机",
        "行政助理兼司机",
        "网络工程师",
        "销售经理"
      ]
    },

    {
      url: "services.html#business",
      keywords: [
        "业务中心",
        "互联网接入",
        "企业宽带",
        "互联网专线",
        "isp",
        "idc",
        "ip-vpn",
        "ip vpn",
        "数据中心",
        "企业专线",
        "sd-wan",
        "sd wan",
        "网络接入"
      ]
    },

    {
      url: "services.html#engineering",
      keywords: [
        "工程中心",
        "通信工程",
        "系统集成",
        "企业组网",
        "网络建设",
        "智能楼宇",
        "it外包",
        "it 外包",
        "设备安装",
        "系统部署"
      ]
    },

    {
      url: "services.html#enterprise",
      keywords: [
        "大客户服务",
        "大客户",
        "运维支持",
        "技术支持",
        "项目服务",
        "企业客户",
        "长期服务",
        "售后支持"
      ]
    },

    {
      url: "services.html#administration",
      keywords: [
        "行政服务",
        "400企业电话",
        "400电话",
        "呼叫中心",
        "座席外包",
        "咨询培训",
        "企业电话"
      ]
    },

    {
      url: "news.html",
      keywords: [
        "新闻",
        "新闻动态",
        "最新新闻",
        "公司动态",
        "资讯"
      ]
    },

    {
      url: "news-company.html",
      keywords: [
        "公司新闻",
        "企业新闻"
      ]
    },

    {
      url: "news-industry.html",
      keywords: [
        "行业新闻",
        "行业动态",
        "通信行业"
      ]
    },

    {
      url: "news-media.html",
      keywords: [
        "媒体报道",
        "媒体新闻"
      ]
    },

    {
      url: "cases.html",
      keywords: [
        "客户案例",
        "案例",
        "项目案例",
        "解决方案案例",
        "合作案例",
        "成功案例"
      ]
    },

    {
      url: "contact.html",
      keywords: [
        "联系方式",
        "联系我们",
        "联系",
        "电话",
        "联系电话",
        "邮箱",
        "电子邮件",
        "公司地址",
        "地址",
        "公司网址",
        "官网",
        "项目咨询",
        "商务合作",
        "提交需求"
      ]
    },

    {
      url: "login.html",
      keywords: [
        "登录",
        "用户登录",
        "管理员登录",
        "账号登录"
      ]
    },

    {
      url: "admin.html",
      keywords: [
        "后台",
        "管理后台",
        "后台管理",
        "控制台",
        "新闻管理",
        "客户留言管理"
      ]
    }
  ];


  /*
   * 统一处理搜索关键词：
   * 去除首尾空格、标点和多余空格。
   */
  function normalizeKeyword(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[，。！？、；：,.!?;:]/g, "")
      .replace(/\s+/g, " ");
  }


  /*
   * 计算关键词匹配分数。
   * 分数越高，匹配程度越高。
   */
  function calculateMatchScore(
    query,
    candidate
  ) {
    const normalizedCandidate =
      normalizeKeyword(candidate);

    if (
      !query ||
      !normalizedCandidate
    ) {
      return 0;
    }

    /*
     * 完全相同。
     */
    if (
      query === normalizedCandidate
    ) {
      return 100;
    }

    /*
     * 网站关键词以用户输入开头。
     */
    if (
      normalizedCandidate.startsWith(
        query
      )
    ) {
      return 80;
    }

    /*
     * 用户输入以网站关键词开头。
     */
    if (
      query.startsWith(
        normalizedCandidate
      )
    ) {
      return 70;
    }

    /*
     * 网站关键词包含用户输入。
     */
    if (
      normalizedCandidate.includes(
        query
      )
    ) {
      return 60;
    }

    /*
     * 用户输入包含网站关键词。
     */
    if (
      query.includes(
        normalizedCandidate
      )
    ) {
      return 50;
    }

    return 0;
  }


  /*
   * 从搜索索引中查找最佳结果。
   */
  function findBestSearchResult(query) {
    let bestResult = null;
    let bestScore = 0;

    searchIndex.forEach((item) => {
      item.keywords.forEach(
        (keyword) => {
          const score =
            calculateMatchScore(
              query,
              keyword
            );

          if (score > bestScore) {
            bestScore = score;
            bestResult = item;
          }
        }
      );
    });

    return bestResult;
  }


  /*
   * 跳转到“暂无数据”页面。
   */
  function goToEmptyPage(
    keyword,
    reason
  ) {
    const parameters =
      new URLSearchParams();

    if (keyword) {
      parameters.set(
        "q",
        keyword
      );
    }

    if (reason) {
      parameters.set(
        "reason",
        reason
      );
    }

    const queryString =
      parameters.toString();

    window.location.href =
      queryString
        ? `search-empty.html?${queryString}`
        : "search-empty.html";
  }


  /*
   * 执行搜索。
   */
  function performSearch() {
    const originalKeyword =
      searchInput.value.trim();

    const normalizedKeyword =
      normalizeKeyword(
        originalKeyword
      );

    /*
     * 没有输入关键词。
     */
    if (!normalizedKeyword) {
      goToEmptyPage(
        "",
        "empty"
      );

      return;
    }

    const result =
      findBestSearchResult(
        normalizedKeyword
      );

    /*
     * 找到匹配结果。
     */
    if (result) {
      window.location.href =
        result.url;

      return;
    }

    /*
     * 没有匹配结果。
     */
    goToEmptyPage(
      originalKeyword,
      "no-results"
    );
  }


  /*
   * 点击搜索按钮。
   */
  searchButton.addEventListener(
    "click",
    performSearch
  );


  /*
   * 在搜索框按 Enter。
   */
  searchInput.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performSearch();
      }
    }
  );
});