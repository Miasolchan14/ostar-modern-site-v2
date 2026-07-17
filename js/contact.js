"use strict";

/*
 * 奥斯达通信客户留言表单
 *
 * 访客只能向 contact_messages 表写入留言，
 * 不能读取其他客户提交的信息。
 */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const supabase =
      window.ostarSupabase;

    const form =
      document.getElementById(
        "contactForm"
      );

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


    if (!form) {
      return;
    }


    /*
     * 首屏按钮滚动到留言表单。
     */
    openFormButton?.addEventListener(
      "click",
      () => {
        scrollToContactForm();
      }
    );


    /*
     * 三个联系渠道按钮：
     * 自动选择相应的咨询类型。
     */
    serviceButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            const serviceType =
              button.dataset
                .contactService;

            if (serviceSelect) {
              serviceSelect.value =
                serviceType || "";
            }

            scrollToContactForm();

            window.setTimeout(
              () => {
                nameInput?.focus();
              },
              500
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
      () => {
        updateMessageCounter();
      }
    );

    updateMessageCounter();


    /*
     * 提交留言。
     */
    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

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

          agreement:
            Boolean(
              agreementInput?.checked
            )
        };


        const validationMessage =
          validateContactForm(
            formValues
          );


        if (validationMessage) {
          showFormMessage(
            validationMessage,
            "error"
          );

          return;
        }


        /*
         * 蜜罐字段被填写，通常代表自动垃圾程序。
         * 对其显示普通成功信息，但不写入数据库。
         */
        if (formValues.website) {
          showFormMessage(
            "联系信息已提交。",
            "success"
          );

          form.reset();
          updateMessageCounter();

          return;
        }


        if (!supabase) {
          showFormMessage(
            "留言服务没有成功连接，请刷新页面后重试。",
            "error"
          );

          return;
        }


        setFormSubmitting(true);


        try {
          const {
            error
          } =
            await supabase
              .from(
                "contact_messages"
              )
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
                  "contact",

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
            "提交成功。您的联系信息已经发送，相关团队将根据需求进行沟通。",
            "success"
          );

          form.reset();
          updateMessageCounter();

          nameInput?.focus();


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


    function scrollToContactForm() {
      formSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }


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


    function setFormSubmitting(
      isSubmitting
    ) {
      if (!submitButton) {
        return;
      }

      submitButton.disabled =
        isSubmitting;

      submitButton.innerHTML =
        isSubmitting
          ? `
            <span>正在提交……</span>
            <b>···</b>
          `
          : `
            <span>提交联系信息</span>
            <b>→</b>
          `;
    }


    function clearFormMessage() {
      if (!formMessage) {
        return;
      }

      formMessage.textContent = "";
      formMessage.className =
        "contact-form-message";
    }


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
  }
);


/* ========================================
   表单验证
======================================== */

function validateContactForm(
  values
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


function isValidContactEmail(
  email
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
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
    return "留言安全策略阻止了本次提交，请检查表单内容后重试。";
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

  return (
    error?.message ||
    "留言暂时无法提交，请稍后重新尝试。"
  );
}