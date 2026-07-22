"use strict";

/*
 * 奥斯达通信客户留言表单
 *
 * 功能：
 * 1. 访客向 contact_messages 表提交留言
 * 2. 表单验证、字数统计与防重复提交
 * 3. 支持通过网址参数自动选择咨询类型
 * 4. 通过蜜罐字段拦截常见垃圾提交
 */

document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.ostarSupabase;

  const form =
    document.getElementById("contactForm");

  if (!form) {
    return;
  }

  const formSection =
    document.getElementById(
      "contactFormSection"
    );

  const openFormButton =
    document.getElementById(
      "openContactFormButton"
    );

  const serviceButtons =
    Array.from(
      document.querySelectorAll(
        "[data-contact-service]"
      )
    );

  const nameInput =
    document.getElementById(
      "contactName"
    );

  const companyInput =
    document.getElementById(
      "contactCompany"
    );

  const phoneInput =
    document.getElementById(
      "contactPhone"
    );

  const emailInput =
    document.getElementById(
      "contactEmail"
    );

  const serviceSelect =
    document.getElementById(
      "contactServiceType"
    );

  const messageInput =
    document.getElementById(
      "contactMessage"
    );

  const websiteInput =
    document.getElementById(
      "contactWebsite"
    );

  const sourcePageInput =
    document.getElementById(
      "contactSourcePage"
    );

  const agreementInput =
    document.getElementById(
      "contactAgreement"
    );

  const messageCounter =
    document.getElementById(
      "contactMessageCount"
    );

  const formMessage =
    document.getElementById(
      "contactFormMessage"
    );

  const submitButton =
    document.getElementById(
      "contactSubmitButton"
    );


  const allowedServiceTypes = [
    "network",
    "engineering",
    "integration",
    "enterprise",
    "support",
    "cooperation",
    "recruitment",
    "other"
  ];

  let isSubmitting = false;

  const requestedService =
    getRequestedServiceFromUrl(
      allowedServiceTypes
    );

  if (
    requestedService &&
    serviceSelect
  ) {
    serviceSelect.value =
      requestedService;
  }


  /*
   * 通过网址参数进入时自动滚动到表单。
   *
   * 示例：
   * contact.html?service=recruitment
   */
  if (
    requestedService ||
    window.location.hash ===
      "#contactFormSection"
  ) {
    window.setTimeout(
      () => {
        scrollToContactForm(false);
      },
      150
    );
  }


  /*
   * 首屏按钮滚动到表单。
   */
  openFormButton?.addEventListener(
    "click",
    () => {
      scrollToContactForm(true);
    }
  );


  /*
   * 联系渠道按钮自动选择咨询类型。
   */
  serviceButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          const serviceType =
            button.dataset
              .contactService || "";

          if (
            serviceSelect &&
            allowedServiceTypes.includes(
              serviceType
            )
          ) {
            serviceSelect.value =
              serviceType;
          }

          scrollToContactForm(true);

          window.setTimeout(
            () => {
              nameInput?.focus();
            },
            450
          );
        }
      );
    }
  );


  /*
   * 留言字数统计。
   */
  messageInput?.addEventListener(
    "input",
    updateMessageCounter
  );

  updateMessageCounter();


  /*
   * 用户继续编辑时清除旧错误提示。
   */
  [
    nameInput,
    companyInput,
    phoneInput,
    emailInput,
    serviceSelect,
    messageInput,
    agreementInput
  ]
    .filter(Boolean)
    .forEach((element) => {
      element.addEventListener(
        "input",
        clearErrorMessage
      );

      element.addEventListener(
        "change",
        clearErrorMessage
      );
    });


  /*
   * 提交留言。
   */
  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

      clearFormMessage();

      const formValues = {
        name:
          nameInput?.value.trim() || "",

        company:
          companyInput?.value.trim() || "",

        phone:
          phoneInput?.value.trim() || "",

        email:
          emailInput?.value.trim() || "",

        serviceType:
          serviceSelect?.value || "",

        message:
          messageInput?.value.trim() || "",

        website:
          websiteInput?.value.trim() || "",

        sourcePage:
          sourcePageInput?.value.trim() ||
          getCurrentSourcePage(),

        agreement:
          Boolean(
            agreementInput?.checked
          )
      };

      const validationMessage =
        validateContactForm(
          formValues,
          allowedServiceTypes
        );

      if (validationMessage) {
        showFormMessage(
          validationMessage,
          "error"
        );

        return;
      }


      /*
       * 蜜罐字段被填写时，不写入数据库。
       * 对自动程序仍显示普通成功结果。
       */
      if (formValues.website) {
        showFormMessage(
          "联系信息已提交。",
          "success"
        );

        resetContactForm(
          requestedService
        );

        return;
      }


      /*
       * 当前设备离线时停止提交。
       */
      if (!navigator.onLine) {
        showFormMessage(
          "当前设备似乎没有连接网络，请恢复网络后重新提交。",
          "error"
        );

        return;
      }


      /*
       * Supabase 客户端没有加载。
       */
      if (!supabase) {
        showFormMessage(
          "留言服务没有成功连接，请刷新页面后重试。",
          "error"
        );

        return;
      }


      setFormSubmitting(true);

      try {
        const { error } =
          await supabase
            .from("contact_messages")
            .insert({
              name:
                formValues.name,

              company:
                formValues.company ||
                null,

              phone:
                formValues.phone ||
                null,

              email:
                formValues.email ||
                null,

              service_type:
                formValues.serviceType,

              message:
                formValues.message,

              source_page:
                formValues.sourcePage,

              status:
                "new",

              admin_note:
                null,

              website:
                ""
            });

        if (error) {
          throw error;
        }

        showFormMessage(
          "提交成功。您的联系信息已经发送，相关团队将根据需求与您沟通。",
          "success"
        );

        resetContactForm(
          requestedService
        );

        window.setTimeout(
          () => {
            nameInput?.focus();
          },
          250
        );

      } catch (error) {
        console.error(
          "客户留言提交失败：",
          error
        );

        showFormMessage(
          getContactErrorMessage(
            error
          ),
          "error"
        );

      } finally {
        setFormSubmitting(false);
      }
    }
  );


  /*
   * 滚动到联系表单。
   */
  function scrollToContactForm(
    useSmoothScroll
  ) {
    formSection?.scrollIntoView({
      behavior:
        useSmoothScroll
          ? "smooth"
          : "auto",

      block: "start"
    });
  }


  /*
   * 更新留言字数。
   */
  function updateMessageCounter() {
    if (!messageCounter) {
      return;
    }

    messageCounter.textContent =
      String(
        messageInput?.value.length ||
        0
      );
  }


  /*
   * 重置表单。
   */
  function resetContactForm(
    serviceToRestore
  ) {
    form.reset();

    if (
      serviceSelect &&
      serviceToRestore &&
      allowedServiceTypes.includes(
        serviceToRestore
      )
    ) {
      serviceSelect.value =
        serviceToRestore;
    }

    updateMessageCounter();
  }


  /*
   * 设置提交按钮状态。
   */
  function setFormSubmitting(
    submitting
  ) {
    isSubmitting = submitting;

    form.setAttribute(
      "aria-busy",
      String(submitting)
    );

    if (!submitButton) {
      return;
    }

    submitButton.disabled =
      submitting;

    submitButton.innerHTML =
      submitting
        ? `
          <span>正在提交……</span>
          <b>···</b>
        `
        : `
          <span>提交联系信息</span>
          <b>→</b>
        `;
  }


  /*
   * 清除提示信息。
   */
  function clearFormMessage() {
    if (!formMessage) {
      return;
    }

    formMessage.textContent = "";

    formMessage.className =
      "contact-form-message";
  }


  /*
   * 用户修改内容时清除错误提示。
   */
  function clearErrorMessage() {
    if (
      formMessage?.classList.contains(
        "error"
      )
    ) {
      clearFormMessage();
    }
  }


  /*
   * 显示成功或错误提示。
   */
  function showFormMessage(
    text,
    type
  ) {
    if (!formMessage) {
      return;
    }

    formMessage.textContent =
      text;

    formMessage.className =
      `contact-form-message ${type}`;

    formMessage.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }
});


/* ========================================
   表单验证
======================================== */

function validateContactForm(
  values,
  allowedServiceTypes
) {
  if (
    values.name.length < 1 ||
    values.name.length > 80
  ) {
    return "请输入正确的联系人姓名。";
  }

  if (
    values.company.length > 160
  ) {
    return "公司或机构名称不能超过160个字符。";
  }

  if (
    !values.phone &&
    !values.email
  ) {
    return "联系电话和电子邮箱至少填写一项。";
  }

  if (
    values.phone.length > 40
  ) {
    return "联系电话内容过长，请检查后重新填写。";
  }

  if (
    values.phone &&
    !isValidContactPhone(
      values.phone
    )
  ) {
    return "联系电话格式不正确，请检查后重新填写。";
  }

  if (
    values.email.length > 160
  ) {
    return "电子邮箱内容过长，请检查后重新填写。";
  }

  if (
    values.email &&
    !isValidContactEmail(
      values.email
    )
  ) {
    return "电子邮箱格式不正确。";
  }

  if (
    !allowedServiceTypes.includes(
      values.serviceType
    )
  ) {
    return "请选择咨询类型。";
  }

  if (
    values.message.length < 10
  ) {
    return "项目需求或留言至少需要填写10个字符。";
  }

  if (
    values.message.length > 2000
  ) {
    return "项目需求或留言不能超过2000个字符。";
  }

  if (!values.agreement) {
    return "请勾选信息使用确认选项。";
  }

  return "";
}


/*
 * 邮箱格式验证。
 */
function isValidContactEmail(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}


/*
 * 电话格式验证。
 *
 * 支持：
 * 数字
 * +
 * -
 * 空格
 * 小括号
 */
function isValidContactPhone(
  phone
) {
  const normalizedPhone =
    phone.replace(/\s+/g, "");

  return /^[0-9+()\-]{6,40}$/
    .test(normalizedPhone);
}


/* ========================================
   URL 与来源页面
======================================== */

/*
 * 从网址中读取咨询类型。
 *
 * 示例：
 * contact.html?service=recruitment
 */
function getRequestedServiceFromUrl(
  allowedServiceTypes
) {
  const parameters =
    new URLSearchParams(
      window.location.search
    );

  const service =
    String(
      parameters.get("service") || ""
    )
      .trim()
      .toLowerCase();

  return allowedServiceTypes.includes(
    service
  )
    ? service
    : "";
}


/*
 * 获取当前来源页面。
 */
function getCurrentSourcePage() {
  const fileName =
    window.location.pathname
      .split("/")
      .filter(Boolean)
      .pop();

  return fileName ||
    "contact.html";
}


/* ========================================
   数据库错误提示
======================================== */

function getContactErrorMessage(
  error
) {
  const message =
    String(
      error?.message || ""
    ).toLowerCase();

  if (
    message.includes(
      "failed to fetch"
    ) ||
    message.includes(
      "network"
    )
  ) {
    return "无法连接留言服务器，请检查网络后重新提交。";
  }

  if (
    message.includes(
      "permission denied"
    )
  ) {
    return "留言提交权限尚未正确开启，请联系网站管理员。";
  }

  if (
    message.includes(
      "row-level security"
    )
  ) {
    return "留言安全策略阻止了本次提交，请联系网站管理员检查提交策略。";
  }

  if (
    message.includes(
      "contact_method_required"
    )
  ) {
    return "联系电话和电子邮箱至少填写一项。";
  }

  if (
    message.includes(
      "check constraint"
    )
  ) {
    return "部分表单内容不符合要求，请检查后重新提交。";
  }

  if (
    message.includes(
      "duplicate"
    )
  ) {
    return "该信息可能已经提交，请勿重复提交。";
  }

  return "留言暂时无法提交，请稍后重新尝试。";
}