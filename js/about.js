"use strict";

/*
 * 奥斯达通信关于我们页面
 *
 * 功能：
 * 1. 切换公司介绍、荣誉资质、人才招聘
 * 2. 根据网址 hash 自动打开对应栏目
 * 3. 支持键盘左右方向键切换
 * 4. 首屏“了解公司”按钮滚动到栏目区域
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


    /*
     * 页面缺少必要元素时停止执行，
     * 避免出现 JavaScript 报错。
     */
    if (
      tabButtons.length === 0 ||
      tabPanels.length === 0
    ) {
      return;
    }


    const validTabs = [
      "company",
      "honors",
      "careers"
    ];


    /*
     * 打开指定栏目。
     */
    function activateAboutTab(
      tabName,
      options = {}
    ) {
      const {
        updateHash = true,
        shouldScroll = false,
        shouldFocus = false
      } = options;


      const safeTabName =
        validTabs.includes(tabName)
          ? tabName
          : "company";


      /*
       * 更新栏目按钮状态。
       */
      tabButtons.forEach(
        (button) => {
          const isActive =
            button.dataset.aboutTab ===
            safeTabName;

          button.classList.toggle(
            "active",
            isActive
          );

          button.setAttribute(
            "aria-selected",
            String(isActive)
          );

          button.tabIndex =
            isActive
              ? 0
              : -1;


          if (
            isActive &&
            shouldFocus
          ) {
            button.focus();
          }
        }
      );


      /*
       * 更新栏目内容状态。
       */
      tabPanels.forEach(
        (panel) => {
          const isActive =
            panel.dataset.aboutPanel ===
            safeTabName;

          panel.classList.toggle(
            "active",
            isActive
          );

          panel.hidden =
            !isActive;
        }
      );


      /*
       * 更新浏览器地址。
       */
      if (updateHash) {
        const newHash =
          `#${safeTabName}`;

        if (
          window.location.hash !==
          newHash
        ) {
          history.replaceState(
            null,
            "",
            newHash
          );
        }
      }


      /*
       * 需要时滚动到栏目区域。
       */
      if (shouldScroll) {
        contentSection?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }


    /*
     * 点击栏目按钮。
     */
    tabButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            activateAboutTab(
              button.dataset.aboutTab,
              {
                updateHash: true,
                shouldScroll: false,
                shouldFocus: false
              }
            );
          }
        );
      }
    );


    /*
     * 键盘左右方向键切换栏目。
     */
    tabButtons.forEach(
      (button) => {
        button.addEventListener(
          "keydown",
          (event) => {
            const currentIndex =
              tabButtons.indexOf(
                button
              );


            let nextIndex =
              currentIndex;


            if (
              event.key ===
              "ArrowRight"
            ) {
              nextIndex =
                (
                  currentIndex + 1
                ) %
                tabButtons.length;
            } else if (
              event.key ===
              "ArrowLeft"
            ) {
              nextIndex =
                (
                  currentIndex - 1 +
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


            activateAboutTab(
              nextButton.dataset.aboutTab,
              {
                updateHash: true,
                shouldScroll: false,
                shouldFocus: true
              }
            );
          }
        );
      }
    );


    /*
     * 首屏“了解公司”按钮。
     */
    viewAboutButton?.addEventListener(
      "click",
      () => {
        activateAboutTab(
          "company",
          {
            updateHash: true,
            shouldScroll: true,
            shouldFocus: false
          }
        );
      }
    );


    /*
     * 用户手动修改网址 hash，
     * 或点击浏览器前进、后退时切换栏目。
     */
    window.addEventListener(
      "hashchange",
      () => {
        const hashTab =
          getAboutTabFromHash();

        activateAboutTab(
          hashTab,
          {
            updateHash: false,
            shouldScroll: false,
            shouldFocus: false
          }
        );
      }
    );


    /*
     * 页面首次打开时确定显示栏目。
     */
    const initialTab =
      getAboutTabFromHash();

    activateAboutTab(
      initialTab,
      {
        updateHash:
          !window.location.hash,
        shouldScroll: false,
        shouldFocus: false
      }
    );
  }
);


/*
 * 从网址中读取栏目名称。
 */
function getAboutTabFromHash() {
  const hashValue =
    window.location.hash
      .replace("#", "")
      .trim()
      .toLowerCase();

  const validTabs = [
    "company",
    "honors",
    "careers"
  ];

  return validTabs.includes(
    hashValue
  )
    ? hashValue
    : "company";
}