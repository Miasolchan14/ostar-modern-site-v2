"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const supabase = window.ostarSupabase;

  if (!supabase) {
    console.error("Supabase 客户端未加载。");
    return;
  }

  /* ======================================
     管理员登录别名

     请将下面的管理员邮箱替换成：
     你在 Supabase Authentication 中
     创建管理员账号时使用的真实邮箱。
  ====================================== */

  const ADMIN_LOGIN_ALIAS = "miasol";

  const ADMIN_EMAIL =
    "miasolchan14@gmail.com";


  /* ======================================
     获取页面元素
  ====================================== */

  const tabs =
    document.querySelectorAll(".auth-tab");

  const panels =
    document.querySelectorAll(".auth-panel");

  const passwordButtons =
    document.querySelectorAll(".password-toggle");

  const loginForm =
    document.getElementById("loginForm");

  const registerForm =
    document.getElementById("registerForm");

  const guestLoginButton =
    document.getElementById("guestLoginButton");

  const forgotPasswordButton =
    document.getElementById("forgotPasswordButton");

  const loginMessage =
    document.getElementById("loginMessage");

  const registerMessage =
    document.getElementById("registerMessage");

  const guestMessage =
    document.getElementById("guestMessage");


  /* ======================================
     登录、注册、游客面板切换
  ====================================== */

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId =
        tab.dataset.authTarget;

      tabs.forEach((item) => {
        item.classList.remove("active");
      });

      panels.forEach((panel) => {
        panel.classList.remove("active");
      });

      tab.classList.add("active");

      const targetPanel =
        document.getElementById(targetId);

      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });
  });


  /* ======================================
     显示或隐藏密码
  ====================================== */

  passwordButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const inputId =
        button.dataset.passwordTarget;

      const input =
        document.getElementById(inputId);

      if (!input) {
        return;
      }

      const isPassword =
        input.type === "password";

      input.type =
        isPassword ? "text" : "password";

      button.textContent =
        isPassword ? "隐藏" : "显示";
    });
  });


  /* ======================================
     真实账号登录
  ====================================== */

  loginForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const accountInput =
        document.getElementById("loginAccount");

      const passwordInput =
        document.getElementById("loginPassword");

      const submitButton =
        loginForm.querySelector(
          ".auth-submit-button"
        );

      const account =
        accountInput.value.trim();

      const password =
        passwordInput.value;

      resetMessage(loginMessage);

      if (!account || !password) {
        showMessage(
          loginMessage,
          "请输入完整的账号和密码。",
          "error"
        );

        return;
      }

      /*
       * 管理员输入 miasol 时，
       * 自动转换为 Supabase 管理员邮箱。
       *
       * 普通用户直接输入自己的邮箱。
       */
      const loginEmail =
        account.toLowerCase() ===
        ADMIN_LOGIN_ALIAS
          ? ADMIN_EMAIL
          : account;

      if (!isValidEmail(loginEmail)) {
        showMessage(
          loginMessage,
          "普通用户请输入有效邮箱，管理员可以输入 miasol。",
          "error"
        );

        return;
      }

      setButtonLoading(
        submitButton,
        true,
        "正在验证账号..."
      );

      try {
        const {
          data: loginData,
          error: loginError
        } =
          await supabase.auth
            .signInWithPassword({
              email: loginEmail,
              password
            });

        if (loginError) {
          throw loginError;
        }

        const user =
          loginData.user;

        if (!user) {
          throw new Error(
            "未能读取登录用户信息。"
          );
        }

        /*
         * 从 profiles 表查询当前用户角色
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

        if (profileError) {
          await supabase.auth.signOut();

          throw new Error(
            "登录成功，但无法读取用户身份。请检查 profiles 表。"
          );
        }

        const currentUser = {
          id: user.id,
          email: user.email,
          username:
            profile.username,
          displayName:
            profile.display_name ||
            profile.username,
          role: profile.role,
          loginTime:
            new Date().toISOString()
        };

        localStorage.setItem(
          "ostarCurrentUser",
          JSON.stringify(currentUser)
        );

        showMessage(
          loginMessage,
          profile.role === "admin"
            ? "管理员身份验证成功，正在进入管理后台……"
            : "登录成功，正在进入网站……",
          "success"
        );

        window.setTimeout(() => {
          if (profile.role === "admin") {
            window.location.href =
              "admin.html";
          } else {
            window.location.href =
              "index.html";
          }
        }, 900);

      } catch (error) {
        console.error(
          "登录失败：",
          error
        );

        showMessage(
          loginMessage,
          getLoginErrorMessage(error),
          "error"
        );
      } finally {
        setButtonLoading(
          submitButton,
          false,
          "登录账号"
        );
      }
    }
  );


  /* ======================================
     真实用户注册
  ====================================== */

  registerForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const name =
        document
          .getElementById("registerName")
          .value
          .trim();

      const email =
        document
          .getElementById("registerEmail")
          .value
          .trim()
          .toLowerCase();

      const password =
        document
          .getElementById("registerPassword")
          .value;

      const confirmPassword =
        document
          .getElementById("confirmPassword")
          .value;

      const agreement =
        document
          .getElementById("registerAgreement")
          .checked;

      const submitButton =
        registerForm.querySelector(
          ".auth-submit-button"
        );

      resetMessage(registerMessage);

      if (
        !name ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        showMessage(
          registerMessage,
          "请完整填写注册信息。",
          "error"
        );

        return;
      }

      if (!isValidEmail(email)) {
        showMessage(
          registerMessage,
          "请输入有效的电子邮箱。",
          "error"
        );

        return;
      }

      if (password.length < 6) {
        showMessage(
          registerMessage,
          "密码长度不能少于6位。",
          "error"
        );

        return;
      }

      if (password !== confirmPassword) {
        showMessage(
          registerMessage,
          "两次输入的密码不一致。",
          "error"
        );

        return;
      }

      if (!agreement) {
        showMessage(
          registerMessage,
          "请先同意用户服务条款和隐私说明。",
          "error"
        );

        return;
      }

      setButtonLoading(
        submitButton,
        true,
        "正在创建账号..."
      );

      try {
        const {
          data,
          error
        } =
          await supabase.auth.signUp({
            email,
            password,

            options: {
              data: {
                display_name: name
              }
            }
          });

        if (error) {
          throw error;
        }

        registerForm.reset();

        /*
         * 如果 data.session 存在，
         * 说明当前项目允许注册后直接登录。
         *
         * 如果 data.session 为 null，
         * 通常说明需要用户进入邮箱完成确认。
         */
        if (data.session) {
          showMessage(
            registerMessage,
            "注册成功，账号已经登录。",
            "success"
          );

          window.setTimeout(() => {
            window.location.href =
              "index.html";
          }, 1000);
        } else {
          showMessage(
            registerMessage,
            "注册成功，请进入邮箱完成账号确认后再登录。",
            "success"
          );
        }

      } catch (error) {
        console.error(
          "注册失败：",
          error
        );

        showMessage(
          registerMessage,
          getRegisterErrorMessage(error),
          "error"
        );
      } finally {
        setButtonLoading(
          submitButton,
          false,
          "创建账号"
        );
      }
    }
  );


  /* ======================================
     游客访问
  ====================================== */

  guestLoginButton?.addEventListener(
    "click",
    () => {
      const guestSession = {
        role: "guest",
        username: "guest",
        displayName: "游客",
        loginTime:
          new Date().toISOString()
      };

      localStorage.setItem(
        "ostarCurrentUser",
        JSON.stringify(guestSession)
      );

      showMessage(
        guestMessage,
        "游客身份创建成功，正在进入网站……",
        "success"
      );

      window.setTimeout(() => {
        window.location.href =
          "index.html";
      }, 700);
    }
  );


  /* ======================================
     忘记密码
  ====================================== */

  forgotPasswordButton?.addEventListener(
    "click",
    () => {
      const account =
        document
          .getElementById("loginAccount")
          .value
          .trim();

      if (!account) {
        showMessage(
          loginMessage,
          "请先在账号输入框填写注册邮箱。",
          "error"
        );

        return;
      }

      showMessage(
        loginMessage,
        "密码找回功能将在后续步骤中启用。",
        "success"
      );
    }
  );
});


/* ======================================
   工具函数
====================================== */

function showMessage(
  element,
  text,
  type
) {
  if (!element) {
    return;
  }

  element.textContent = text;

  element.classList.remove(
    "error",
    "success"
  );

  element.classList.add(type);
}


function resetMessage(element) {
  if (!element) {
    return;
  }

  element.textContent = "";

  element.classList.remove(
    "error",
    "success"
  );
}


function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}


function setButtonLoading(
  button,
  loading,
  text
) {
  if (!button) {
    return;
  }

  button.disabled = loading;

  button.innerHTML = loading
    ? `<span>${text}</span>`
    : `<span>${text}</span><span>→</span>`;
}


function getLoginErrorMessage(error) {
  const message =
    String(error?.message || "")
      .toLowerCase();

  if (
    message.includes(
      "invalid login credentials"
    )
  ) {
    return "账号或密码不正确。";
  }

  if (
    message.includes(
      "email not confirmed"
    )
  ) {
    return "该邮箱尚未完成确认，请先检查邮箱。";
  }

  if (
    message.includes(
      "failed to fetch"
    )
  ) {
    return "无法连接登录服务器，请检查网络后重试。";
  }

  return error?.message ||
    "登录失败，请稍后重试。";
}


function getRegisterErrorMessage(error) {
  const message =
    String(error?.message || "")
      .toLowerCase();

  if (
    message.includes(
      "user already registered"
    )
  ) {
    return "该邮箱已经注册，请直接登录。";
  }

  if (
    message.includes(
      "password"
    )
  ) {
    return "密码不符合安全要求，请更换密码。";
  }

  if (
    message.includes(
      "failed to fetch"
    )
  ) {
    return "无法连接注册服务器，请检查网络后重试。";
  }

  return error?.message ||
    "注册失败，请稍后重试。";
}