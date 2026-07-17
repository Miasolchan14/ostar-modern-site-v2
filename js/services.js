"use strict";

/*
 * 服务项目页面栏目切换
 */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const tabButtons =
      Array.from(
        document.querySelectorAll(
          "[data-service-tab]"
        )
      );

    const tabPanels =
      Array.from(
        document.querySelectorAll(
          "[data-service-panel]"
        )
      );

    const openButtons =
      Array.from(
        document.querySelectorAll(
          "[data-service-open]"
        )
      );


    if (
      tabButtons.length === 0 ||
      tabPanels.length === 0
    ) {
      return;
    }


    function activateServiceTab(
      tabName,
      shouldScroll = false
    ) {
      const validNames =
        tabButtons.map(
          (button) =>
            button.dataset.serviceTab
        );

      const safeTabName =
        validNames.includes(tabName)
          ? tabName
          : "business";


      tabButtons.forEach(
        (button) => {
          const isActive =
            button.dataset.serviceTab ===
            safeTabName;

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


      tabPanels.forEach(
        (panel) => {
          const isActive =
            panel.dataset.servicePanel ===
            safeTabName;

          panel.hidden = !isActive;

          panel.classList.toggle(
            "active",
            isActive
          );
        }
      );


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


      if (shouldScroll) {
        document
          .querySelector(
            ".services-content-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      }
    }


    tabButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            activateServiceTab(
              button.dataset.serviceTab
            );
          }
        );
      }
    );


    openButtons.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            activateServiceTab(
              button.dataset.serviceOpen,
              true
            );
          }
        );
      }
    );


    window.addEventListener(
      "hashchange",
      () => {
        activateServiceTab(
          window.location.hash
            .replace("#", "")
        );
      }
    );


    const initialTab =
      window.location.hash
        .replace("#", "") ||
      "business";

    activateServiceTab(initialTab);
  }
);