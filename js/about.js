"use strict";

/*
 * 奥斯达通信“关于我们”页面
 *
 * 功能：
 * 1. 切换公司介绍、董事长寄语、荣誉资质、人才招聘和管理团队；
 * 2. 支持 about.html#team 等网址直接打开对应栏目；
 * 3. 支持浏览器前进与后退；
 * 4. 支持键盘左右方向键、Home 和 End；
 * 5. 自动读取 HTML 中的栏目，不需要固定栏目名单。
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

    /*
     * 获取所有栏目按钮。
     *
     * HTML示例：
     * data-about-tab="company"
     * data-about-tab="chairman"
     * data-about-tab="honors"
     * data-about-tab="careers"
     * data-about-tab="team"
     */
    const tabButtons =
      Array.from(
        document.querySelectorAll(
          "[data-about-tab]"
        )
      );

    /*
     * 获取所有栏目内容面板。
     *
     * HTML示例：
     * data-about-panel="company"
     * data-about-panel="chairman"
     * data-about-panel="honors"
     * data-about-panel="careers"
     * data-about-panel="team"
     */
    const tabPanels =
      Array.from(
        document.querySelectorAll(
          "[data-about-panel]"
        )
      );


    /*
     * 页面中没有栏目时停止运行。
     */
    if (
      tabButtons.length === 0 ||
      tabPanels.length === 0
    ) {
      console.warn(
        "关于我们页面没有找到栏目按钮或内容面板。"
      );

      return;
    }


    /*
     * 自动读取HTML中现有的栏目名称。
     * 因此以后继续新增栏目，也不需要修改固定名单。
     */
    const availableTabs =
      tabButtons
        .map(
          (button) =>
            String(
              button.dataset.aboutTab ||
              ""
            )
              .trim()
              .toLowerCase()
        )
        .filter(Boolean);


    /*
     * 检查栏目名称。
     * 不存在时默认返回第一个栏目。
     */
    function normalizeTabName(
      tabName
    ) {
      const normalizedName =
        String(tabName || "")
          .trim()
          .toLowerCase();

      return availableTabs.includes(
        normalizedName
      )
        ? normalizedName
        : availableTabs[0];
    }


    /*
     * 打开指定栏目。
     */
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


      /*
       * 更新顶部栏目按钮状态。
       */
      tabButtons.forEach(
        (button) => {
          const buttonTabName =
            String(
              button.dataset.aboutTab ||
              ""
            )
              .trim()
              .toLowerCase();

          const isActive =
            buttonTabName === activeTab;

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


      /*
       * 更新栏目内容显示状态。
       */
      tabPanels.forEach(
        (panel) => {
          const panelTabName =
            String(
              panel.dataset.aboutPanel ||
              ""
            )
              .trim()
              .toLowerCase();

          const isActive =
            panelTabName === activeTab;

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


      /*
       * 更新网址地址。
       *
       * 例如：
       * about.html#company
       * about.html#chairman
       * about.html#honors
       * about.html#careers
       * about.html#team
       */
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


      /*
       * 需要时滚动到栏目区域。
       */
      if (scrollToSection) {
        contentSection?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }


    /*
     * 点击栏目按钮进行切换。
     */
    tabButtons.forEach(
      (
        button,
        buttonIndex
      ) => {
        button.addEventListener(
          "click",
          () => {
            const tabName =
              button.dataset.aboutTab;

            openAboutTab(
              tabName,
              {
                updateHash: true,
                focusButton: false,
                scrollToSection: false
              }
            );
          }
        );


        /*
         * 键盘切换栏目。
         *
         * 右方向键：下一个栏目
         * 左方向键：上一个栏目
         * Home：第一个栏目
         * End：最后一个栏目
         */
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


            const nextButton =
              tabButtons[nextIndex];

            openAboutTab(
              nextButton.dataset.aboutTab,
              {
                updateHash: true,
                focusButton: true,
                scrollToSection: false
              }
            );
          }
        );
      }
    );


    /*
     * 页面首屏的“了解公司”按钮。
     */
    viewAboutButton?.addEventListener(
      "click",
      () => {
        openAboutTab(
          "company",
          {
            updateHash: true,
            focusButton: false,
            scrollToSection: true
          }
        );
      }
    );


    /*
     * 从网址中读取栏目名称。
     *
     * 例如：
     * about.html#team
     *
     * 返回：
     * team
     */
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


    /*
     * 页面第一次打开时，
     * 根据网址决定显示哪个栏目。
     */
    const initialTab =
      getTabFromHash();

    openAboutTab(
      availableTabs.includes(
        initialTab
      )
        ? initialTab
        : availableTabs[0],
      {
        updateHash: false,
        focusButton: false,
        scrollToSection: false
      }
    );


    /*
     * 浏览器点击“后退”或“前进”时，
     * 同步切换对应栏目。
     */
    window.addEventListener(
      "popstate",
      () => {
        const tabFromHash =
          getTabFromHash();

        openAboutTab(
          tabFromHash,
          {
            updateHash: false,
            focusButton: false,
            scrollToSection: false
          }
        );
      }
    );


    /*
     * 地址栏哈希变化时同步栏目。
     *
     * 例如点击页脚：
     * about.html#team
     */
    window.addEventListener(
      "hashchange",
      () => {
        const tabFromHash =
          getTabFromHash();

        if (
          availableTabs.includes(
            tabFromHash
          )
        ) {
          openAboutTab(
            tabFromHash,
            {
              updateHash: false,
              focusButton: false,
              scrollToSection: true
            }
          );
        }
      }
    );
  }
);