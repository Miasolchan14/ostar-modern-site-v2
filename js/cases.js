"use strict";

/*
 * 客户案例分类筛选
 */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const filterButtons =
      Array.from(
        document.querySelectorAll(
          "[data-case-filter]"
        )
      );

    const caseCards =
      Array.from(
        document.querySelectorAll(
          "[data-case-category]"
        )
      );

    const resultInfo =
      document.getElementById(
        "casesResultInfo"
      );

    const emptyState =
      document.getElementById(
        "casesEmpty"
      );

    const viewCasesButton =
      document.getElementById(
        "viewCasesButton"
      );


    if (
      filterButtons.length === 0 ||
      caseCards.length === 0
    ) {
      return;
    }


    const filterLabels = {
      all: "全部案例",
      network: "企业网络",
      engineering: "通信工程",
      integration: "系统集成",
      support: "运维支持"
    };


    function activateCaseFilter(
      filterName,
      shouldScroll = false
    ) {
      const validFilters =
        Object.keys(filterLabels);

      const safeFilter =
        validFilters.includes(filterName)
          ? filterName
          : "all";


      filterButtons.forEach(
        (button) => {
          const isActive =
            button.dataset.caseFilter ===
            safeFilter;

          button.classList.toggle(
            "active",
            isActive
          );

          button.setAttribute(
            "aria-selected",
            String(isActive)
          );
        }
      );


      let visibleCount = 0;

      caseCards.forEach(
        (card) => {
          const shouldShow =
            safeFilter === "all" ||
            card.dataset.caseCategory ===
              safeFilter;

          card.hidden = !shouldShow;

          if (shouldShow) {
            visibleCount += 1;
          }
        }
      );


      if (resultInfo) {
        resultInfo.textContent =
          `当前显示：${
            filterLabels[safeFilter]
          }，共 ${visibleCount} 个案例`;
      }


      if (emptyState) {
        emptyState.hidden =
          visibleCount !== 0;
      }


      const newHash =
        `#${safeFilter}`;

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


      if (shouldScroll) {
        document
          .getElementById(
            "casesListSection"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    }


    filterButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            activateCaseFilter(
              button.dataset.caseFilter
            );
          }
        );
      }
    );


    viewCasesButton?.addEventListener(
      "click",
      () => {
        activateCaseFilter(
          "all",
          true
        );
      }
    );


    window.addEventListener(
      "hashchange",
      () => {
        activateCaseFilter(
          window.location.hash
            .replace("#", "")
        );
      }
    );


    const initialFilter =
      window.location.hash
        .replace("#", "") ||
      "all";

    activateCaseFilter(
      initialFilter
    );
  }
);