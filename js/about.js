"use strict";

/*
 * 奥斯达通信“关于我们”页面
 *
 * 功能：
 * 1. 切换公司介绍、董事长寄语、荣誉资质和人才招聘；
 * 2. 支持 about.html#chairman 等网址直接打开栏目；
 * 3. 支持浏览器前进与后退；
 * 4. 支持键盘左右方向键、Home 和 End；
 * 5. 不干扰页面中的专利证书轮播。
 */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const contentSection =
      document.getElementById(
        "aboutContentSection"
      );

    const viewAboutButton =
      document.getElementById(
        "viewAboutButton"
      );

    const tabButtons =
      Array.from(
        document.querySelectorAll(
          "[data-about-tab]"
        )
      );

    const tabPanels =
      Array.from(
        document.querySelectorAll(
          "[data-about-panel]"
        )
      );

    if (
      tabButtons.length === 0 ||
      tabPanels.length === 0
    ) {
      return;
    }

    const availableTabs =
      tabButtons
        .map((button) =>
          String(
            button.dataset.aboutTab || ""
          )
            .trim()
            .toLowerCase()
        )
        .filter(Boolean);

    function normalizeTabName(
      tabName
    ) {
      const normalized =
        String(tabName || "")
          .trim()
          .toLowerCase();

      return availableTabs.includes(
        normalized
      )
        ? normalized
        : availableTabs[0];
    }

    function openAboutTab(
      tabName,
      options = {}
    ) {
      const {
        updateHash = true,
        focusButton = false,
        scrollToSection = false
      } = options;

      const activeTab =
        normalizeTabName(
          tabName
        );

      tabButtons.forEach(
        (button) => {
          const isActive =
            String(
              button.dataset.aboutTab ||
              ""
            ).toLowerCase() ===
            activeTab;

          button.classList.toggle(
            "active",
            isActive
          );

          button.setAttribute(
            "aria-selected",
            String(isActive)
          );

          button.tabIndex =
            isActive ? 0 : -1;

          if (
            isActive &&
            focusButton
          ) {
            button.focus();
          }
        }
      );

      tabPanels.forEach(
        (panel) => {
          const isActive =
            String(
              panel.dataset.aboutPanel ||
              ""
            ).toLowerCase() ===
            activeTab;

          panel.classList.toggle(
            "active",
            isActive
          );

          panel.hidden =
            !isActive;

          panel.setAttribute(
            "aria-hidden",
            String(!isActive)
          );
        }
      );

      if (
        updateHash &&
        window.location.hash !==
          `#${activeTab}`
      ) {
        window.history.pushState(
          null,
          "",
          `#${activeTab}`
        );
      }

      if (scrollToSection) {
        contentSection?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }

    tabButtons.forEach(
      (
        button,
        buttonIndex
      ) => {
        button.addEventListener(
          "click",
          () => {
            openAboutTab(
              button.dataset.aboutTab,
              {
                updateHash: true
              }
            );
          }
        );

        button.addEventListener(
          "keydown",
          (event) => {
            let nextIndex =
              buttonIndex;

            if (
              event.key ===
              "ArrowRight"
            ) {
              nextIndex =
                (
                  buttonIndex + 1
                ) %
                tabButtons.length;
            } else if (
              event.key ===
              "ArrowLeft"
            ) {
              nextIndex =
                (
                  buttonIndex -
                  1 +
                  tabButtons.length
                ) %
                tabButtons.length;
            } else if (
              event.key ===
              "Home"
            ) {
              nextIndex = 0;
            } else if (
              event.key ===
              "End"
            ) {
              nextIndex =
                tabButtons.length - 1;
            } else {
              return;
            }

            event.preventDefault();

            openAboutTab(
              tabButtons[
                nextIndex
              ].dataset.aboutTab,
              {
                updateHash: true,
                focusButton: true
              }
            );
          }
        );
      }
    );

    viewAboutButton?.addEventListener(
      "click",
      () => {
        openAboutTab(
          "company",
          {
            updateHash: true,
            scrollToSection: true
          }
        );
      }
    );

    function getTabFromHash() {
      try {
        return decodeURIComponent(
          window.location.hash
            .replace(/^#/, "")
            .trim()
            .toLowerCase()
        );
      } catch (error) {
        console.warn(
          "无法读取关于我们栏目地址：",
          error
        );

        return "";
      }
    }

    const initialTab =
      getTabFromHash();

    openAboutTab(
      availableTabs.includes(
        initialTab
      )
        ? initialTab
        : availableTabs[0],
      {
        updateHash: false
      }
    );

    window.addEventListener(
      "popstate",
      () => {
        openAboutTab(
          getTabFromHash(),
          {
            updateHash: false
          }
        );
      }
    );

    window.addEventListener(
      "hashchange",
      () => {
        const hashTab =
          getTabFromHash();

        if (
          availableTabs.includes(
            hashTab
          )
        ) {
          openAboutTab(
            hashTab,
            {
              updateHash: false
            }
          );
        }
      }
    );
  }
);