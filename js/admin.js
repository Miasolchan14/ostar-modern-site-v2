"use strict";

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const supabase =
      window.ostarSupabase;

    const loadingText =
      document.getElementById(
        "adminLoadingText"
      );

    if (!supabase) {
      showAdminLoadingError(
        loadingText,
        "Supabase 客户端未加载，请检查脚本配置。"
      );

      return;
    }

    try {
      /*
       * 不能只读取 localStorage 判断管理员。
       * 必须重新向 Supabase 验证真实登录用户。
       */
      const {
        data: userData,
        error: userError
      } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        redirectToLogin();
        return;
      }

      const user =
        userData.user;

      loadingText.textContent =
        "正在检查管理员权限……";

      /*
       * 查询当前用户自己的 profiles 资料。
       * 现有 RLS 规则只允许读取自己的资料。
       */
      const {
        data: profile,
        error: profileError
      } =
        await supabase
          .from("profiles")
          .select(
            "username, display_name, role"
          )
          .eq("id", user.id)
          .single();

      if (profileError || !profile) {
        console.error(
          "管理员资料读取失败：",
          profileError
        );

        await supabase.auth.signOut();
        localStorage.removeItem(
          "ostarCurrentUser"
        );

        redirectToLogin(
          "profile_error"
        );

        return;
      }

      /*
       * 不是管理员时禁止进入后台。
       */
      if (profile.role !== "admin") {
        await supabase.auth.signOut();

        localStorage.removeItem(
          "ostarCurrentUser"
        );

        redirectToLogin(
          "not_admin"
        );

        return;
      }

      /*
       * 身份验证成功后填充管理员资料。
       */
      fillAdministratorProfile(
        user,
        profile
      );

      setupAdminNavigation();
      setupAdminLogout(supabase);
      setCurrentDate();

      document.body.classList.add(
        "admin-ready"
      );

      console.log(
        "管理员身份验证成功：",
        profile.username
      );

    } catch (error) {
      console.error(
        "管理后台初始化失败：",
        error
      );

      showAdminLoadingError(
        loadingText,
        "后台加载失败，请刷新页面后重试。"
      );
    }
  }
);


/* ========================================
   填充管理员资料
======================================== */

function fillAdministratorProfile(
  user,
  profile
) {
  const displayName =
    profile.display_name ||
    profile.username ||
    "管理员";

  setText(
    "adminDisplayName",
    displayName
  );

  setText(
    "adminWelcomeName",
    displayName
  );

  setText(
    "adminEmail",
    user.email || "管理员账号"
  );

  const avatar =
    document.getElementById(
      "adminUserAvatar"
    );

  if (avatar) {
    avatar.textContent =
      displayName
        .trim()
        .charAt(0)
        .toUpperCase() || "M";
  }
}


/* ========================================
   管理后台导航切换
======================================== */

function setupAdminNavigation() {
  const navButtons =
    document.querySelectorAll(
      ".admin-nav-button"
    );

  const panels =
    document.querySelectorAll(
      ".admin-panel"
    );

  const openPanelButtons =
    document.querySelectorAll(
      "[data-open-panel]"
    );

  navButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const panelId =
          button.dataset.adminPanel;

        const panelTitle =
          button.dataset.panelTitle;

        openAdminPanel(
          panelId,
          panelTitle,
          navButtons,
          panels
        );
      }
    );
  });

  openPanelButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const panelId =
          button.dataset.openPanel;

        const matchingNavButton =
          document.querySelector(
            `[data-admin-panel="${panelId}"]`
          );

        const panelTitle =
          matchingNavButton
            ?.dataset.panelTitle ||
          "管理中心";

        openAdminPanel(
          panelId,
          panelTitle,
          navButtons,
          panels
        );
      }
    );
  });
}


function openAdminPanel(
  panelId,
  panelTitle,
  navButtons,
  panels
) {
  panels.forEach((panel) => {
    panel.classList.remove("active");
  });

  navButtons.forEach((button) => {
    button.classList.remove("active");
  });

  const targetPanel =
    document.getElementById(panelId);

  const targetButton =
    document.querySelector(
      `[data-admin-panel="${panelId}"]`
    );

  if (targetPanel) {
    targetPanel.classList.add(
      "active"
    );
  }

  if (targetButton) {
    targetButton.classList.add(
      "active"
    );
  }

  setText(
    "adminPageTitle",
    panelTitle
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ========================================
   管理员退出
======================================== */

function setupAdminLogout(supabase) {
  const logoutButton =
    document.getElementById(
      "adminLogoutButton"
    );

  logoutButton?.addEventListener(
    "click",
    async () => {
      logoutButton.disabled = true;
      logoutButton.textContent =
        "正在退出……";

      try {
        const { error } =
          await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        localStorage.removeItem(
          "ostarCurrentUser"
        );

        window.location.replace(
          "login.html"
        );

      } catch (error) {
        console.error(
          "退出失败：",
          error
        );

        logoutButton.disabled = false;
        logoutButton.innerHTML =
          "<span>←</span>退出管理员账号";

        window.alert(
          "退出失败，请检查网络后重试。"
        );
      }
    }
  );
}


/* ========================================
   当前日期
======================================== */

function setCurrentDate() {
  const dateText =
    new Intl.DateTimeFormat(
      "zh-CN",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      }
    ).format(new Date());

  setText(
    "adminCurrentDate",
    dateText
  );
}


/* ========================================
   登录跳转
======================================== */

function redirectToLogin(reason = "") {
  const query =
    reason
      ? `?reason=${encodeURIComponent(
          reason
        )}`
      : "";

  window.location.replace(
    `login.html${query}`
  );
}


/* ========================================
   错误提示
======================================== */

function showAdminLoadingError(
  element,
  message
) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.style.color = "#d64545";
}


/* ========================================
   通用文字设置
======================================== */

function setText(id, text) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}