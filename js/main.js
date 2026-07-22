/* ========================================
   奥斯达在线客服
======================================== */

(function initializeOstarCustomerService() {
  /*
   * 将下面内容替换成客服平台提供的真实 ID。
   */
  const customerServiceId =
    "请填写你的客服ID";


  /*
   * 没有填写 ID 时停止加载，
   * 避免网站产生无效请求。
   */
  if (
    !customerServiceId ||
    customerServiceId ===
      "请填写你的客服ID"
  ) {
    console.warn(
      "在线客服尚未配置：请在 js/main.js 中填写客服ID。"
    );

    return;
  }


  /*
   * 防止同一个页面重复加载客服脚本。
   */
  if (
    document.querySelector(
      "script[data-ostar-customer-service]"
    )
  ) {
    return;
  }


  function loadCustomerService() {
    const script =
      document.createElement(
        "script"
      );

    script.src =
      "https://api.kefu.leimingyun.com/siteKefu.js" +
      "?id=" +
      encodeURIComponent(
        customerServiceId
      );

    script.async = true;

    script.setAttribute(
      "data-ostar-customer-service",
      "true"
    );


    script.addEventListener(
      "load",
      () => {
        console.log(
          "奥斯达在线客服加载成功。"
        );
      }
    );


    script.addEventListener(
      "error",
      () => {
        console.error(
          "在线客服加载失败，请检查客服ID和网络连接。"
        );
      }
    );


    document.body.appendChild(
      script
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      loadCustomerService,
      {
        once: true
      }
    );
  } else {
    loadCustomerService();
  }
})();