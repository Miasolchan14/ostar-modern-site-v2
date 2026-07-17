"use strict";

/*
 * 奥斯达通信后台客户留言管理
 *
 * 功能：
 * 1. 读取 contact_messages 表
 * 2. 按留言状态筛选
 * 3. 查看完整留言
 * 4. 修改状态和管理员备注
 * 5. 删除留言
 * 6. 更新留言统计数字
 */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await waitForMessageAdminReady();

    const supabase =
      window.ostarSupabase;

    const messagesPanel =
      document.getElementById(
        "messagesPanel"
      );

    const messagesList =
      document.getElementById(
        "adminMessagesList"
      );

    if (
      !messagesPanel ||
      !messagesList
    ) {
      return;
    }

    if (!supabase) {
      showMessageListError(
        messagesList,
        "Supabase 留言服务没有成功连接。"
      );

      return;
    }


    /* =====================================
       页面元素
    ===================================== */

    const refreshButton =
      document.getElementById(
        "refreshMessagesButton"
      );

    const filterButtons =
      Array.from(
        document.querySelectorAll(
          "[data-message-filter]"
        )
      );


    /* 统计数字 */

    const totalCountElement =
      document.getElementById(
        "totalMessageCount"
      );

    const newCountElement =
      document.getElementById(
        "newMessageCount"
      );

    const processingCountElement =
      document.getElementById(
        "processingMessageCount"
      );

    const completedCountElement =
      document.getElementById(
        "completedMessageCount"
      );

    const sidebarCountElement =
      document.getElementById(
        "sidebarMessageCount"
      );


    /* 留言详情 */

    const detailEmpty =
      document.getElementById(
        "messageDetailEmpty"
      );

    const detailForm =
      document.getElementById(
        "messageDetailForm"
      );

    const activeMessageIdInput =
      document.getElementById(
        "activeMessageId"
      );

    const detailService =
      document.getElementById(
        "messageDetailService"
      );

    const detailName =
      document.getElementById(
        "messageDetailName"
      );

    const detailStatusBadge =
      document.getElementById(
        "messageDetailStatusBadge"
      );

    const detailCompany =
      document.getElementById(
        "messageDetailCompany"
      );

    const detailPhone =
      document.getElementById(
        "messageDetailPhone"
      );

    const detailEmail =
      document.getElementById(
        "messageDetailEmail"
      );

    const detailDate =
      document.getElementById(
        "messageDetailDate"
      );

    const detailContent =
      document.getElementById(
        "messageDetailContent"
      );

    const statusSelect =
      document.getElementById(
        "messageStatusSelect"
      );

    const adminNoteInput =
      document.getElementById(
        "messageAdminNote"
      );

    const editorFeedback =
      document.getElementById(
        "messageEditorFeedback"
      );

    const saveButton =
      document.getElementById(
        "saveMessageButton"
      );

    const deleteButton =
      document.getElementById(
        "deleteMessageButton"
      );


    /* =====================================
       页面状态
    ===================================== */

    let allMessages = [];

    let activeFilter = "all";

    let activeMessageId = "";


    /* =====================================
       读取客户留言
    ===================================== */

    async function loadMessages() {
      setMessageListLoading();

      clearMessageFeedback();

      try {
        const {
          data,
          error
        } =
          await supabase
            .from("contact_messages")
            .select(`
              id,
              name,
              company,
              phone,
              email,
              service_type,
              message,
              source_page,
              status,
              admin_note,
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


        allMessages =
          Array.isArray(data)
            ? data
            : [];


        updateMessageSummary();

        renderMessageList();


        /*
         * 刷新后继续显示原来选择的留言。
         */
        if (activeMessageId) {
          const activeMessage =
            allMessages.find(
              (messageItem) =>
                messageItem.id ===
                activeMessageId
            );

          if (activeMessage) {
            showMessageDetail(
              activeMessage
            );
          } else {
            closeMessageDetail();
          }
        }


      } catch (error) {
        console.error(
          "客户留言读取失败：",
          error
        );

        showMessageListError(
          messagesList,
          getMessageAdminError(
            error
          )
        );
      }
    }


    /* =====================================
       留言筛选
    ===================================== */

    filterButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            activeFilter =
              button.dataset
                .messageFilter ||
              "all";


            filterButtons.forEach(
              (filterButton) => {
                filterButton.classList.toggle(
                  "active",
                  filterButton === button
                );
              }
            );


            renderMessageList();
          }
        );
      }
    );


    function getFilteredMessages() {
      if (activeFilter === "all") {
        return allMessages;
      }

      return allMessages.filter(
        (messageItem) =>
          messageItem.status ===
          activeFilter
      );
    }


    /* =====================================
       渲染留言列表
    ===================================== */

    function renderMessageList() {
      const filteredMessages =
        getFilteredMessages();


      if (
        filteredMessages.length === 0
      ) {
        messagesList.innerHTML = `
          <div class="admin-message-empty">

            <span>✉</span>

            <h3>
              当前分类没有留言
            </h3>

            <p>
              新的客户留言提交后，
              会自动显示在这里。
            </p>

          </div>
        `;

        return;
      }


      messagesList.innerHTML =
        filteredMessages
          .map(
            createMessageListItem
          )
          .join("");


      messagesList
        .querySelectorAll(
          "[data-message-id]"
        )
        .forEach(
          (messageButton) => {
            messageButton.addEventListener(
              "click",
              () => {
                const messageId =
                  messageButton.dataset
                    .messageId;

                const selectedMessage =
                  allMessages.find(
                    (messageItem) =>
                      messageItem.id ===
                      messageId
                  );

                if (!selectedMessage) {
                  return;
                }

                activeMessageId =
                  selectedMessage.id;

                showMessageDetail(
                  selectedMessage
                );

                updateSelectedMessageCard();
              }
            );
          }
        );


      updateSelectedMessageCard();
    }


    function createMessageListItem(
      messageItem
    ) {
      const statusInformation =
        getMessageStatusInformation(
          messageItem.status
        );

      const serviceLabel =
        getMessageServiceLabel(
          messageItem.service_type
        );

      const companyText =
        messageItem.company ||
        "未填写公司";

      const contactText =
        messageItem.phone ||
        messageItem.email ||
        "未填写联系方式";


      return `
        <button
          class="admin-message-card"
          type="button"
          data-message-id="${escapeMessageHtml(
            messageItem.id
          )}"
        >

          <div class="admin-message-card-header">

            <div>

              <span class="message-service-label">
                ${escapeMessageHtml(
                  serviceLabel
                )}
              </span>

              <strong>
                ${escapeMessageHtml(
                  messageItem.name
                )}
              </strong>

            </div>

            <span
              class="message-list-status ${
                statusInformation.className
              }"
            >
              ${escapeMessageHtml(
                statusInformation.label
              )}
            </span>

          </div>


          <div class="admin-message-company">
            ${escapeMessageHtml(
              companyText
            )}
          </div>


          <p class="admin-message-preview">
            ${escapeMessageHtml(
              messageItem.message
            )}
          </p>


          <div class="admin-message-card-footer">

            <span>
              ${escapeMessageHtml(
                contactText
              )}
            </span>

            <time>
              ${formatMessageDate(
                messageItem.created_at,
                false
              )}
            </time>

          </div>

        </button>
      `;
    }


    function updateSelectedMessageCard() {
      messagesList
        .querySelectorAll(
          "[data-message-id]"
        )
        .forEach(
          (messageButton) => {
            messageButton.classList.toggle(
              "selected",
              messageButton.dataset
                .messageId ===
                activeMessageId
            );
          }
        );
    }


    /* =====================================
       显示留言详情
    ===================================== */

    function showMessageDetail(
      messageItem
    ) {
      activeMessageId =
        messageItem.id;


      if (detailEmpty) {
        detailEmpty.hidden = true;
      }

      if (detailForm) {
        detailForm.hidden = false;
      }


      setMessageText(
        detailService,
        getMessageServiceLabel(
          messageItem.service_type
        )
      );

      setMessageText(
        detailName,
        messageItem.name
      );

      setMessageText(
        detailCompany,
        messageItem.company || "—"
      );

      setMessageText(
        detailPhone,
        messageItem.phone || "—"
      );

      setMessageText(
        detailEmail,
        messageItem.email || "—"
      );

      setMessageText(
        detailDate,
        formatMessageDate(
          messageItem.created_at,
          true
        )
      );

      setMessageText(
        detailContent,
        messageItem.message
      );


      if (activeMessageIdInput) {
        activeMessageIdInput.value =
          messageItem.id;
      }


      if (statusSelect) {
        statusSelect.value =
          messageItem.status;
      }


      if (adminNoteInput) {
        adminNoteInput.value =
          messageItem.admin_note || "";
      }


      updateDetailStatusBadge(
        messageItem.status
      );

      clearMessageFeedback();

      updateSelectedMessageCard();
    }


    function closeMessageDetail() {
      activeMessageId = "";

      if (detailForm) {
        detailForm.hidden = true;
      }

      if (detailEmpty) {
        detailEmpty.hidden = false;
      }

      if (activeMessageIdInput) {
        activeMessageIdInput.value = "";
      }

      updateSelectedMessageCard();
    }


    function updateDetailStatusBadge(
      status
    ) {
      if (!detailStatusBadge) {
        return;
      }

      const statusInformation =
        getMessageStatusInformation(
          status
        );

      detailStatusBadge.textContent =
        statusInformation.label;

      detailStatusBadge.className =
        `message-detail-status ${
          statusInformation.className
        }`;
    }


    /* =====================================
       保存留言状态和备注
    ===================================== */

    detailForm?.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        clearMessageFeedback();


        const messageId =
          activeMessageIdInput
            ?.value ||
          activeMessageId;


        if (!messageId) {
          showMessageFeedback(
            "请先选择一条留言。",
            "error"
          );

          return;
        }


        const selectedStatus =
          statusSelect?.value ||
          "new";

        const allowedStatuses = [
          "new",
          "read",
          "contacted",
          "completed",
          "archived"
        ];


        if (
          !allowedStatuses.includes(
            selectedStatus
          )
        ) {
          showMessageFeedback(
            "留言状态不正确。",
            "error"
          );

          return;
        }


        const adminNote =
          adminNoteInput
            ?.value.trim() ||
          "";


        setMessageSaving(true);


        try {
          const {
            data,
            error
          } =
            await supabase
              .from(
                "contact_messages"
              )
              .update({
                status:
                  selectedStatus,

                admin_note:
                  adminNote || null
              })
              .eq(
                "id",
                messageId
              )
              .select(`
                id,
                name,
                company,
                phone,
                email,
                service_type,
                message,
                source_page,
                status,
                admin_note,
                created_at,
                updated_at
              `)
              .single();


          if (error) {
            throw error;
          }


          const messageIndex =
            allMessages.findIndex(
              (messageItem) =>
                messageItem.id ===
                messageId
            );


          if (
            messageIndex !== -1 &&
            data
          ) {
            allMessages[
              messageIndex
            ] = data;
          }


          updateMessageSummary();

          renderMessageList();

          if (data) {
            showMessageDetail(data);
          }


          showMessageFeedback(
            "留言状态和管理员备注已保存。",
            "success"
          );


        } catch (error) {
          console.error(
            "留言更新失败：",
            error
          );

          showMessageFeedback(
            getMessageAdminError(
              error
            ),
            "error"
          );

        } finally {
          setMessageSaving(false);
        }
      }
    );


    /* =====================================
       删除留言
    ===================================== */

    deleteButton?.addEventListener(
      "click",
      async () => {
        const messageId =
          activeMessageIdInput
            ?.value ||
          activeMessageId;


        if (!messageId) {
          showMessageFeedback(
            "请先选择一条留言。",
            "error"
          );

          return;
        }


        const selectedMessage =
          allMessages.find(
            (messageItem) =>
              messageItem.id ===
              messageId
          );


        const confirmed =
          window.confirm(
            `确定删除“${
              selectedMessage?.name ||
              "这位客户"
            }”提交的留言吗？\n\n删除后无法恢复。`
          );


        if (!confirmed) {
          return;
        }


        setMessageDeleting(true);


        try {
          const {
            error
          } =
            await supabase
              .from(
                "contact_messages"
              )
              .delete()
              .eq(
                "id",
                messageId
              );


          if (error) {
            throw error;
          }


          allMessages =
            allMessages.filter(
              (messageItem) =>
                messageItem.id !==
                messageId
            );


          closeMessageDetail();

          updateMessageSummary();

          renderMessageList();


        } catch (error) {
          console.error(
            "留言删除失败：",
            error
          );

          showMessageFeedback(
            getMessageAdminError(
              error
            ),
            "error"
          );

        } finally {
          setMessageDeleting(false);
        }
      }
    );


    /* =====================================
       刷新留言
    ===================================== */

    refreshButton?.addEventListener(
      "click",
      async () => {
        refreshButton.disabled = true;
        refreshButton.textContent =
          "正在刷新……";

        await loadMessages();

        refreshButton.disabled = false;
        refreshButton.textContent =
          "↻ 刷新留言";
      }
    );


    /* =====================================
       统计数字
    ===================================== */

    function updateMessageSummary() {
      const totalCount =
        allMessages.length;

      const newCount =
        allMessages.filter(
          (messageItem) =>
            messageItem.status ===
            "new"
        ).length;

      const processingCount =
        allMessages.filter(
          (messageItem) =>
            messageItem.status ===
              "read" ||
            messageItem.status ===
              "contacted"
        ).length;

      const completedCount =
        allMessages.filter(
          (messageItem) =>
            messageItem.status ===
            "completed"
        ).length;


      setMessageText(
        totalCountElement,
        String(totalCount)
      );

      setMessageText(
        newCountElement,
        String(newCount)
      );

      setMessageText(
        processingCountElement,
        String(processingCount)
      );

      setMessageText(
        completedCountElement,
        String(completedCount)
      );

      setMessageText(
        sidebarCountElement,
        String(newCount)
      );


      if (sidebarCountElement) {
        sidebarCountElement.hidden =
          newCount === 0;
      }
    }


    /* =====================================
       按钮状态
    ===================================== */

    function setMessageSaving(
      isSaving
    ) {
      if (!saveButton) {
        return;
      }

      saveButton.disabled =
        isSaving;

      saveButton.innerHTML =
        isSaving
          ? `
            正在保存……
            <span>···</span>
          `
          : `
            保存状态与备注
            <span>→</span>
          `;
    }


    function setMessageDeleting(
      isDeleting
    ) {
      if (!deleteButton) {
        return;
      }

      deleteButton.disabled =
        isDeleting;

      deleteButton.textContent =
        isDeleting
          ? "正在删除……"
          : "删除留言";
    }


    /* =====================================
       页面提示
    ===================================== */

    function clearMessageFeedback() {
      if (!editorFeedback) {
        return;
      }

      editorFeedback.textContent = "";

      editorFeedback.className =
        "message-editor-feedback";
    }


    function showMessageFeedback(
      message,
      type
    ) {
      if (!editorFeedback) {
        return;
      }

      editorFeedback.textContent =
        message;

      editorFeedback.className =
        `message-editor-feedback ${type}`;
    }


    function setMessageListLoading() {
      messagesList.innerHTML = `
        <div class="admin-list-loading">
          正在读取客户留言……
        </div>
      `;
    }


    /* 首次读取留言 */

    await loadMessages();
  }
);


/* ========================================
   等待管理员身份验证完成
======================================== */

function waitForMessageAdminReady() {
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


      /*
       * 避免浏览器异常时永久等待。
       */
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
   留言状态信息
======================================== */

function getMessageStatusInformation(
  status
) {
  const information = {
    new: {
      label: "新留言",
      className: "status-new"
    },

    read: {
      label: "已查看",
      className: "status-read"
    },

    contacted: {
      label: "已联系",
      className: "status-contacted"
    },

    completed: {
      label: "已完成",
      className: "status-completed"
    },

    archived: {
      label: "已归档",
      className: "status-archived"
    }
  };


  return (
    information[status] ||
    {
      label: "未知状态",
      className: "status-unknown"
    }
  );
}


/* ========================================
   留言服务类型
======================================== */

function getMessageServiceLabel(
  serviceType
) {
  const labels = {
    network:
      "企业网络与互联网接入",

    engineering:
      "通信工程",

    integration:
      "系统集成",

    enterprise:
      "大客户服务",

    support:
      "运维与技术支持",

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
   日期显示
======================================== */

function formatMessageDate(
  value,
  includeTime
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
    includeTime
      ? {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }
      : {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }
  ).format(date);
}


/* ========================================
   设置元素文字
======================================== */

function setMessageText(
  element,
  value
) {
  if (element) {
    element.textContent =
      value || "";
  }
}


/* ========================================
   列表错误
======================================== */

function showMessageListError(
  element,
  message
) {
  if (!element) {
    return;
  }

  element.innerHTML = `
    <div class="admin-message-error">

      <span>!</span>

      <h3>
        客户留言暂时无法读取
      </h3>

      <p>
        ${escapeMessageHtml(message)}
      </p>

    </div>
  `;
}


/* ========================================
   数据库错误信息
======================================== */

function getMessageAdminError(
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
    return "无法连接留言服务器，请检查网络后刷新。";
  }


  if (
    message.includes(
      "permission denied"
    ) ||
    message.includes(
      "row-level security"
    )
  ) {
    return "管理员留言权限配置异常，请检查登录身份和 RLS 策略。";
  }


  if (
    message.includes(
      "not found"
    )
  ) {
    return "没有找到对应的留言记录。";
  }


  return (
    error?.message ||
    "留言操作失败，请稍后重试。"
  );
}


/* ========================================
   HTML 安全处理
======================================== */

function escapeMessageHtml(
  value
) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}