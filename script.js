// ==UserScript==
// @name         MKM Helper
// @namespace    https://gist.github.com/n21lv/ca7dbefd5955afc7205049ad950aec96
// @updateUrl    https://gist.github.com/n21lv/ca7dbefd5955afc7205049ad950aec96/raw/mkm_helper.user.js
// @downloadUrl  https://gist.github.com/n21lv/ca7dbefd5955afc7205049ad950aec96/raw/mkm_helper.user.js
// @version      0.8
// @description  Various useful UI modifications for Cardmarket (Magic & FaB)
// @author       n21lv
// @match        https://www.cardmarket.com/*/Magic/Products/*/*
// @match        https://www.cardmarket.com/*/FleshAndBlood/Products/*/*
// @match        https://www.cardmarket.com/*/Magic/Cards/*
// @match        https://www.cardmarket.com/*/FleshAndBlood/Cards/*
// @match        https://www.cardmarket.com/*/Magic/Wants/*
// @match        https://www.cardmarket.com/*/FleshAndBlood/Wants/*
// @match        https://www.cardmarket.com/*/Magic/Orders/*
// @match        https://www.cardmarket.com/*/FleshAndBlood/Orders/*
// @match        https://www.cardmarket.com/*/Magic/ShoppingCart
// @match        https://www.cardmarket.com/*/FleshAndBlood/ShoppingCart
// @match        https://www.cardmarket.com/*/Magic/Users/*/Offers/Singles*
// @match        https://www.cardmarket.com/*/FleshAndBlood/Users/*/Offers/Singles*
// @match        https://www.cardmarket.com/*/Magic/Orders/Search/Results*
// @match        https://www.cardmarket.com/*/FleshAndBlood/Orders/Search/Results*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cardmarket.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  /**
   * ============== CONSTANTS ==============
   */
  const SEARCH_PERIOD = 59; // "2 months"
  const HREF = window.location.href;
  const game = window.location.pathname.split("/")[2].toLowerCase();
  const cardNameRegexClean = /^([^(]*).*/; // used for search and exporting card lists to clipboard
  const fabCardNameRegex = /^([^(\n]*)\s?(\((red|yellow|blue)\))?/i;

  /**
   * ============== FUNCTIONS ==============
   */

  window.writeToClipboard = function (contents, callback) {
    navigator.clipboard.writeText(contents).then(callback);
  };

  function processShowHideRestrictedClick(forceHide) {
    let s = ``;
    const button = _j$("#toggleHideShowRestricted");
    const buttonProperties = {
      hide: {
        css: { "background-color": "#a5afc4", "text-shadow": "1px 1px #222" },
        title: "Show Restricted",
      },
      show: {
        css: { "background-color": "#012169", "text-shadow": "none" },
        title: "Hide Restricted",
      },
    };

    let articles = _j$("div.article-row:has(a.btn-grey)");
    let shouldHide = forceHide ?? window.hideRestricted;
    let action = shouldHide ? "hide" : "show";

    articles[action]();
    button.css(buttonProperties[action].css);
    button.html(buttonProperties[action].title);

    if (typeof window.hideRestricted != "undefined") {
      window.hideRestricted = !window.hideRestricted;
      s = `: window.hideRestricted=${window.hideRestricted},`;
    }
  }

  function processHideNewRestricted() {
    // Hide newly rendred rows if user clicked "Show more results"

    if (isLoggedIn && window.hideRestricted === false) {
      let articles = _j$("div.article-row:has(a.btn-grey)");
      if (articles.length > 0) {
        articles.hide();
      } else {
        console.log(`articles seems to be undefined:`, articles);
      }
    }
  }

  function processAddSearchIcon() {
    /**
     *  Renders a link icon next to every article that allows for quick checks if you have already ordered it. Useful for tidying up wants lists
     */

    const iconSize = isProductsSinglesPage ? " small" : "";
    const SHIPMENTSTATUS_PAST = 200; // change this when MKM devs introduce a status which doesn't include in-cart items
    const selector =
      isWantsPage || isCartPage
        ? "td.name"
        : isOffersSinglesPage
        ? "div.col-seller:gt(0)"
        : ".page-title-container h1:first-child";

    (() =>
      _j$(selector).each(function () {
        // Get rid of (V.1) and other confusing character sequences
        const cardName = isProductsSinglesPage
          ? _j$(this)
              .contents()
              .filter(function () {
                return this.nodeType == Node.TEXT_NODE;
              })
              .text()
          : _j$(this).text();
        const regexToUse =
          game == "fleshandblood" // && (isProductsSinglesPage || isWantsPage)
            ? fabCardNameRegex
            : cardNameRegexClean;

        const matchNum = game == "magic" ? 1 : 0; // For MTG we return Match 1, for other games we return Match 0
        let productNameClean = regexToUse.exec(cardName)[matchNum].trim();
        if (game == "fleshandblood") {
          // Remove foiling info, as it is not searchable
          productNameClean = productNameClean.replace(/[()]*/g, "").trim();
        }

        if (!_j$(this).data("hasSearchIcon")) {
          const now = new Date();
          const maxDate = now.toLocaleDateString("lt-LT"); // uses ISO date format
          const minDate = new Date(
            new Date(now).setDate(now.getDate() - SEARCH_PERIOD)
          ).toLocaleDateString("lt-LT");
          let searchParams = new URLSearchParams([
            ["productName", productNameClean],
            ["shipmentStatus", SHIPMENTSTATUS_PAST],
            ["minDate", minDate],
            ["maxDate", maxDate],
          ]).toString();

          let searchIconHTML = `<a href="/Orders/Search/Results?userType=buyer&${searchParams}" target="_blank" title="Search in my most recent shipments" style="text-decoration: none;"><span class="fonticon-search mr-1${iconSize}" style="padding-right: 4px;"></span></a>`;
          _j$(this).prepend(searchIconHTML);
          _j$(this).data("hasSearchIcon", true);
        }
      }))();
  }

  function navigateSearchResults(direction) {
    const urlParams = new URLSearchParams(window.location.search);
    const pointOfOrigin =
      direction === "back"
        ? urlParams.get("minDate")
        : urlParams.get("maxDate");
    let dateDiff = direction === "back" ? -SEARCH_PERIOD : SEARCH_PERIOD;
    const fromDate = new Date(pointOfOrigin);

    let newMinDate = new Date(fromDate).setDate(fromDate.getDate() + dateDiff); // subtract SEARCH_PERIOD if moving back, add if moving forward
    let newMaxDate = new Date(fromDate);
    if (direction !== "back") {
      [newMinDate, newMaxDate] = [newMaxDate, newMinDate];
    }

    urlParams.set(`minDate`, new Date(newMinDate).toLocaleDateString("lt-LT"));
    urlParams.set(`maxDate`, new Date(newMaxDate).toLocaleDateString("lt-LT"));
    return (() => (window.location.search = urlParams.toString()))();
  }

  // Process new elements added to DOM tree, e.g. user clicked "Show more results" or added items to cart
  function processNewNodes() {
    if (!shouldRefreshSearchIcons && !shouldRefreshRestricted) {
      return;
    }

    let action = shouldRefreshSearchIcons
      ? "shouldRefreshSearchIcons"
      : "shouldRefreshRestricted";

    let processingProperties = {
      shouldRefreshRestricted: {
        handler: processHideNewRestricted,
        targetNodeSelector: "section#table div.table-body",
      },
      shouldRefreshSearchIcons: {
        handler: processAddSearchIcon,
        targetNodeSelector: isOffersSinglesPage
          ? "div#UserOffersTable div.table-body"
          : isWantsPage
          ? "#WantsListTable tbody"
          : "table[id^=ArticleTable] tbody",
      },
    };

    const targetNode = document.querySelector(
      processingProperties[action].targetNodeSelector
    );
    if (!targetNode) {
      console.log(`navigateSearchResults(): targetNode is not defined`);
      return;
    }

    const observerOptions = { childList: true };
    const observer = new MutationObserver((mutationList, observer) =>
      mutationList.forEach((mutation) => {
        let processingFunc = processingProperties[action].handler;
        if (mutation.type === "childList") {
          if (typeof processingFunc !== "undefined") {
            processingFunc();
          } else {
            console.log(
              `navigateSearchResults(): processingFunc seems to be undefined`
            );
          }
        }
      })
    );
    observer.observe(targetNode, observerOptions);
  }

  /**
   * ============== MAIN PART ==============
   */

  var _j$;

  if (typeof window.jQuery !== "undefined") {
    _j$ = window.jQuery;
  } else {
    console.log("jQuery does not seem to be defined");
  }

  var isProductsOrCardsPage =
    HREF.indexOf("/Products") > -1 || HREF.indexOf("/Cards") > -1;
  var isWantsPage = HREF.indexOf("/Wants") > -1;
  var isCartPage = HREF.indexOf("/ShoppingCart") > -1;
  var isOffersSinglesPage = HREF.indexOf("Offers/Singles") > -1;
  var isProductsSinglesPage =
    HREF.indexOf("Products/Singles") > -1 || HREF.indexOf("/Cards") > -1;
  var isOrdersPage = HREF.indexOf("/Orders") > -1;
  var isSearchResultsPage = HREF.indexOf("/Search/Results") > -1;
  var isLoggedIn = !(_j$("#login-signup").length > 0);

  var docHead, style;
  docHead = document.getElementsByTagName("head")[0];
  if (!docHead) {
    return;
  }
  style = document.createElement("style");
  style.innerHTML = `span#custom-tooltip {
            position: absolute;
            display: block;
            margin-left: 40px;
            padding: 5px 12px;
            background-color: #000000df;
            border-radius: 4px;
            color: #fff;
            visibility: hidden;
            opacity: 0;
            transition: visibility 0s 2s, opacity 2s ease-out;
            z-index: 10000;
    }

    span#custom-tooltip.visible {
        visibility: visible;
        opacity: 1;
        transition: visibility 0s, opacity 0s;
    }`;
  docHead.appendChild(style);

  (function processProductsOrCardsPage() {
    /**
     *  Renders a button that hides/shows articles that you cannot buy (those which have the 'Put in shopping cart' button grayed out)
     */
    if (!isProductsOrCardsPage) {
      return;
    }

    var cssObjHideRestricted = cssObjHideRestricted || {
      width: "110px",
      height: "32px",
      position: "fixed",
      bottom: "3rem",
      right: "1rem",
      "z-index": "10000",
      "background-color": "#012169",
      "box-shadow":
        "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
      border: "none",
      "border-radius": "4px",
      color: "white",
      padding: "7px 12px",
      "text-align": "center",
      "text-decoration": "none",
      display: "inline-block",
      "font-size": "0.8em",
      margin: "4px 2px",
      cursor: "pointer",
    };

    var btnHideRestricted = document.createElement("button"),
      btnHRStyle = btnHideRestricted.style;
    document.body.appendChild(btnHideRestricted);
    btnHideRestricted.id = "toggleHideShowRestricted";
    btnHideRestricted.innerHTML = "Hide Restricted";
    btnHRStyle.position = "absolute";
    Object.keys(cssObjHideRestricted).forEach(function (key) {
      btnHRStyle[key] = cssObjHideRestricted[key];
    });

    _j$("#toggleHideShowRestricted").on("click", () => {
      // This form is necessary in order for handler being properly processed by jQuery
      processShowHideRestrictedClick();
      return;
    });

    if (isLoggedIn) {
      const domNodeHideRestricted = _j$("#toggleHideShowRestricted");
      if (domNodeHideRestricted.length > 0) {
        if (typeof window.hideRestricted == "undefined") {
          window.hideRestricted = true;
        }
        domNodeHideRestricted.trigger("click");
      }
    }
  })();

  window.searchBack = () => {
    navigateSearchResults("back");
  };

  window.searchForward = () => {
    navigateSearchResults("forward");
  };

  (function addSearchNavigation() {
    if (!isSearchResultsPage) {
      return;
    }

    const contentSection = _j$("section");
    if (contentSection.length < 1) {
      console.log(`addSearchNavigation(): Couldn't find contentSection`);
      return;
    }

    const btnSearchForward = `<a href="#" class="btn btn-outline-primary" role="button" onclick="searchForward()" style="float: right;" title="Forward 2 months"><span><i class="fonticon-calendar"></i><i class="fonticon-chevron-right"></i></span></a>`;
    const btnSearchBack = `<a href="#" class="btn btn-outline-primary ms-2" role="button" onclick="searchBack()" style="float: right;" title="Back 2 months"><span><i class="fonticon-chevron-left"></i><i class="fonticon-calendar"></i></span></a>`;
    contentSection.prepend(btnSearchForward, btnSearchBack);

    // Display the current range
    const urlSearchParams = new URLSearchParams(window.location.search);
    const dates = {
      from: urlSearchParams.get("minDate"),
      to: urlSearchParams.get("maxDate"),
    };
    const searchPaginationControls = _j$("section .pagination");

    if (searchPaginationControls.length > 0) {
      searchPaginationControls
        .first()
        .before(
          `<div style="display: flex; flex-direction: row; justify-content: flex-end;"><div id="searchRange" style="margin: -11.5px 0px 0px; font-size: 0.8em; color: var(--bs-gray-500); float: right;">${dates.from} .. ${dates.to}</div></div>`
        );
    }
  })();

  let shouldRefreshSearchIcons =
    isWantsPage || isCartPage || isOffersSinglesPage;
  let shouldRefreshRestricted = isProductsOrCardsPage;

  // Initial processing on page load
  if (shouldRefreshSearchIcons || isProductsSinglesPage) {
    processAddSearchIcon();
  }

  if (shouldRefreshSearchIcons) {
    processNewNodes();
  }

  const loadMoreBtn = document.getElementById("loadMoreButton");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", (e) => {
      processNewNodes(true);
    });
  }

  (function processWantsPage() {
    function addExportWantsToClipboardBtn() {
      var wants = "";
      const wantsTable = document.querySelectorAll(
        '#WantsListTable tbody tr[role="row"]'
      );
      wantsTable.forEach((row) => {
        let cardQty = parseInt(
          row.querySelector("td[data-amount]").dataset.amount
        );
        let cardName = row.querySelector("td.name a:last-child").text;
        wants += `${cardQty} ${cardName}\r\n`;
      });

      const rightmostButtons = document.querySelectorAll(
        'div.flex-column div:last-child a[role="button"]'
      );
      const newBtn = document.createElement("a");
      newBtn.innerHTML = `<a id="CopyWantsToClipboard" href="#CopyToClipboard" role="button" class="btn copyToClipboard-linkBtn btn-outline-primary me-3 mt-2 mt-lg-0">Copy to Clipboard</a><span id="custom-tooltip">Copied!</span>`;

      if (!window.location.pathname.includes("ShoppingWizard")) {
        rightmostButtons[0].parentElement.insertBefore(
          newBtn,
          rightmostButtons[0]
        );
      }

      return wants;
    }

    /**
     * Renders the sum of all prices in the current wants list next to card total count
     */
    function renderTotalPrice() {
      let wantsTable = document.querySelector("section#WantsListTable");
      if (!wantsTable) {
        return;
      }

      let total = 0;
      let wantsTableRows = document.querySelectorAll(
        "#WantsListTable tbody tr"
      );
      wantsTableRows.forEach(function (el) {
        let amount = parseInt(
          el.querySelector("td[data-amount]").dataset.amount
        );
        let price = parseFloat(el.querySelector("td[data-text]").dataset.text);
        total += amount * price;
      });
      let totalPriceNode = document.createElement("div");
      totalPriceNode.style.margin = "-13.5px 0 7.5px";
      totalPriceNode.style.fontSize = "0.9em";
      totalPriceNode.style.color = "var(--gray)";
      totalPriceNode.innerText = `Approx. total price (using buy prices): ${total.toFixed(
        2
      )} €`;
      wantsTable.insertBefore(
        totalPriceNode,
        wantsTable.firstChild.nextSibling
      );
    }

    if (!isWantsPage) {
      return;
    }

    const wantsList = addExportWantsToClipboardBtn();
    const copyWantsToClipboardBtn = document.getElementById(
      "CopyWantsToClipboard"
    );

    if (copyWantsToClipboardBtn) {
      copyWantsToClipboardBtn.addEventListener("click", (e) =>
        window.writeToClipboard(wantsList, function () {
          document.getElementById("custom-tooltip").classList.toggle("visible");
          setTimeout(function () {
            document
              .getElementById("custom-tooltip")
              .classList.toggle("visible");
          }, 2000);
        })
      );
    }
    renderTotalPrice();
  })();

  // Modified processOrdersPage function for Moxfield CSV format
  (function processOrdersPage() {
    /**
     *  Renders an extra button for exporting the order contents to CSV that Moxfield can read
     */

    if (!isOrdersPage) {
      return;
    }

    const setNameToCodeMapping = {
      "Marvel's Spider-Man Tokens": "tspm",
      "Marvel's Spider-Man Eternal": "spe",
      "Marvel Universe": "mar",
      "Marvel's Spider-Man": "spm",
      "Final Fantasy Tokens": "tfin",
      "Final Fantasy Regional Promos": "rfin",
      "Final Fantasy: Through the Ages": "fca",
      "Final Fantasy Art Series": "afin",
      "Final Fantasy Commander Tokens": "tfic",
      "Final Fantasy Commander": "fic",
      "Final Fantasy": "fin",
      "Final Fantasy Promos": "pfin",
      "FIN Standard Showdown": "pss5",
      "Alchemy: Tarkir": "ytdm",
      "Tarkir: Dragonstorm Promos": "ptdm",
      "Tarkir: Dragonstorm Commander Tokens": "ttdc",
      "Tarkir: Dragonstorm Tokens": "ttdm",
      "Tarkir: Dragonstorm Art Series": "atdm",
      "Tarkir: Dragonstorm Commander": "tdc",
      "Tarkir: Dragonstorm": "tdm",
      "Love Your LGS 2025": "plg25",
      "Alchemy: Aetherdrift": "ydft",
      "Secret Lair Showcase Planes": "pssc",
      "Aetherdrift Art Series": "adft",
      "Aetherdrift Promos": "pdft",
      "Aetherdrift Commander": "drc",
      "Aetherdrift Commander Tokens": "tdrc",
      "Year of the Snake 2025": "pl25",
      Aetherdrift: "dft",
      "Aetherdrift Tokens": "tdft",
      "Japan Standard Cup": "pjsc",
      "MagicFest 2025": "pf25",
      "Innistrad Remastered Art Series": "ainr",
      "Innistrad Remastered Tokens": "tinr",
      "Innistrad Remastered": "inr",
      "Spotlight Series": "pspl",
      "Wizards Play Network 2025": "pw25",
      "Pioneer Masters": "pio",
      "Foundations Art Series": "afdn",
      "Foundations Promos": "pfdn",
      "Foundations Jumpstart": "j25",
      "Foundations Front Cards": "ffdn",
      "Foundations Commander": "fdc",
      "Foundations Tokens": "tfdn",
      "Foundations Jumpstart Front Cards": "fj25",
      Foundations: "fdn",
      "Tales of Middle-earth Deluxe Commander Kit": "pltc",
      "Alchemy: Duskmourn": "ydsk",
      "Duskmourn: House of Horror Art Series": "adsk",
      "Duskmourn Commander Tokens": "tdsc",
      "Duskmourn: House of Horror Tokens": "tdsk",
      "Duskmourn: House of Horror Commander": "dsc",
      "Duskmourn: House of Horror Promos": "pdsk",
      "Duskmourn: House of Horror": "dsk",
      "Alchemy: Bloomburrow": "yblb",
      "Love Your LGS 2024": "plg24",
      "Bloomburrow Commander Tokens": "tblc",
      "Bloomburrow Promos": "pblb",
      "Bloomburrow Art Series": "ablb",
      "Bloomburrow Tokens": "tblb",
      "Bloomburrow Commander": "blc",
      "Mystery Booster 2": "mb2",
      "Cowboy Bebop": "pcbb",
      Bloomburrow: "blb",
      "Assassin's Creed Minigames": "macr",
      "Assassin's Creed Art Series": "aacr",
      "Assassin's Creed": "acr",
      "Assassin's Creed Tokens": "tacr",
      "Modern Horizons 3 Promos": "pmh3",
      "Modern Horizons 3 Substitute Cards": "smh3",
      "Modern Horizons 3 Tokens": "tmh3",
      "Modern Horizons 3 Commander": "m3c",
      "Modern Horizons 3 Art Series": "amh3",
      "Modern Horizons 3": "mh3",
      "Modern Horizons 3 Commander Tokens": "tm3c",
      "Modern Horizons 2 Timeshifts": "h2r",
      "Alchemy: Outlaws of Thunder Junction": "yotj",
      "Outlaws of Thunder Junction Promos": "potj",
      "Outlaws of Thunder Junction Tokens": "totj",
      "Outlaws of Thunder Junction Art Series": "aotj",
      "Breaking News Tokens": "totp",
      "Breaking News": "otp",
      "The Big Score": "big",
      "Outlaws of Thunder Junction": "otj",
      "Outlaws of Thunder Junction Commander Tokens": "totc",
      "Outlaws of Thunder Junction Commander": "otc",
      "The Big Score Tokens": "tbig",
      "Fallout Tokens": "tpip",
      Fallout: "pip",
      "Alchemy: Murders at Karlov Manor ": "ymkm",
      "Ravnica: Clue Edition": "clu",
      "Ravnica: Clue Edition Front Cards": "fclu",
      "MKM Standard Showdown": "pss4",
      "Murders at Karlov Manor Tokens": "tmkm",
      "Murders at Karlov Manor Art Series": "amkm",
      "Murders at Karlov Manor Commander Tokens": "tmkc",
      "Murders at Karlov Manor Promos": "pmkm",
      "Murders at Karlov Manor Commander": "mkc",
      "Murders at Karlov Manor": "mkm",
      "MKM Japanese Promo Tokens": "wmkm",
      "Year of the Dragon 2024": "pl24",
      "Ravnica Remastered Tokens": "trvr",
      "Ravnica Remastered": "rvr",
      "MagicFest 2024": "pf24",
      "Wizards Play Network 2024": "pw24",
      "Alchemy: Ixalan": "ylci",
      "The Lost Caverns of Ixalan Art Series": "alci",
      "Special Guests": "spg",
      "The Lost Caverns of Ixalan Promos": "plci",
      "The Lost Caverns of Ixalan Substitute Cards": "slci",
      "The Lost Caverns of Ixalan Tokens": "tlci",
      "The Lost Caverns of Ixalan": "lci",
      "March of the Machine: The Aftermath Promos": "pmat",
      "The Lost Caverns of Ixalan Commander": "lcc",
      "The Lost Caverns of Ixalan Commander Tokens": "tlcc",
      "Jurassic World Collection": "rex",
      "Jurassic World Collection Tokens": "trex",
      "Tales of Middle-earth Scene Box": "altc",
      "Doctor Who": "who",
      "Doctor Who Tokens": "twho",
      "Alchemy: Wilds of Eldraine": "ywoe",
      "Wilds of Eldraine Promos": "pwoe",
      "Wilds of Eldraine Art Series": "awoe",
      "Wilds of Eldraine Tokens": "twoe",
      "Wilds of Eldraine Commander": "woc",
      "Wilds of Eldraine: Enchanting Tales": "wot",
      "WOE Japanese Promo Tokens": "wwoe",
      "Wilds of Eldraine Commander Tokens": "twoc",
      "Wilds of Eldraine": "woe",
      "Magic × Duel Masters Promos": "pmda",
      "Time Spiral Remastered Promos": "ptsr",
      "30th Anniversary Celebration Tokyo": "p30t",
      "Commander Masters Art Series": "acmm",
      "Commander Masters Tokens": "tcmm",
      "Commander Masters": "cmm",
      "2022 Heroes of the Realm": "ph22",
      "Historic Anthology 7": "ha7",
      "Explorer Anthology 3": "ea3",
      "MagicFest 2023": "pf23",
      "Tales of Middle-earth Promos": "pltr",
      "Tales of Middle-earth Commander": "ltc",
      "Tales of Middle-earth Commander Tokens": "tltc",
      "Tales of Middle-earth Front Cards": "fltr",
      "The Lord of the Rings: Tales of Middle-earth": "ltr",
      "Tales of Middle-earth Art Series": "altr",
      "Tales of Middle-earth Tokens": "tltr",
      "March of the Machine: The Aftermath": "mat",
      "March of the Machine Jumpstart Front Cards": "fmom",
      "March of the Machine Commander Tokens": "tmoc",
      "March of the Machine Tokens": "tmom",
      "MOM Japanese Promo Tokens": "wmom",
      "March of the Machine Promos": "pmom",
      "March of the Machine Commander": "moc",
      "March of the Machine Substitute Cards": "smom",
      "March of the Machine": "mom",
      "March of the Machine Art Series": "amom",
      "Multiverse Legends Tokens": "tmul",
      "Multiverse Legends": "mul",
      "Shadows of the Past": "sis",
      "Shadows over Innistrad Remastered": "sir",
      "Alchemy: Phyrexia": "yone",
      "Secret Lair Showdown": "slp",
      "Unknown Event": "unk",
      "Year of the Rabbit 2023": "pl23",
      "Phyrexia: All Will Be One Promos": "pone",
      "Phyrexia: All Will Be One Tokens": "tone",
      "Phyrexia: All Will Be One Commander Tokens": "tonc",
      "Phyrexia: All Will Be One Jumpstart Front Cards": "fone",
      "Phyrexia: All Will Be One Commander": "onc",
      "Phyrexia: All Will Be One": "one",
      "Phyrexia: All Will Be One Minigames": "mone",
      "Phyrexia: All Will Be One Art Series": "aone",
      "ONE Japanese Promo Tokens": "wone",
      "Dominaria Remastered": "dmr",
      "Dominaria Remastered Tokens": "tdmr",
      "Regional Championship Qualifiers 2023": "pr23",
      "Wizards Play Network 2023": "pw23",
      "Judge Gift Cards 2023": "p23",
      "Alchemy: The Brothers' War": "ybro",
      "Explorer Anthology 2": "ea2",
      "Starter Commander Deck Tokens": "tscd",
      "Starter Commander Decks": "scd",
      "Jumpstart 2022 Front Cards": "fj22",
      "Jumpstart 2022": "j22",
      "30th Anniversary Tokens": "t30a",
      "30th Anniversary Edition": "30a",
      "Eternal Weekend": "pewk",
      "The Brothers' War Commander": "brc",
      "The Brothers' War Retro Artifacts": "brr",
      "The Brothers' War Promos": "pbro",
      "Transformers Tokens": "tbot",
      Transformers: "bot",
      "The Brothers' War Southeast Asia Tokens": "ptbro",
      "The Brothers' War Substitute Cards": "sbro",
      "The Brothers' War Minigames": "mbro",
      "The Brothers' War Tokens": "tbro",
      "The Brothers' War": "bro",
      "The Brothers' War Commander Tokens": "tbrc",
      "The Brothers' War Jumpstart Front Cards": "fbro",
      "The Brothers' War Art Series": "abro",
      "Secret Lair 30th Anniversary Countdown Kit": "slc",
      "Game Night: Free-for-All Tokens": "tgn3",
      "Game Night: Free-for-All": "gn3",
      "The List (Unfinity Foil Edition)": "ulst",
      "Unfinity Sticker Sheets": "sunf",
      "Unfinity Tokens": "tunf",
      Unfinity: "unf",
      "Warhammer 40,000 Tokens": "t40k",
      "Warhammer 40,000 Commander": "40k",
      "Alchemy: Dominaria": "ydmu",
      "Regional Championship Qualifiers 2022": "prcq",
      "30th Anniversary History Promos": "p30h",
      "Dominaria United Promos": "pdmu",
      "Dominaria United Southeast Asia Tokens": "ptdmu",
      "DMU Japanese Promo Tokens": "wdmu",
      "Dominaria United Commander": "dmc",
      "Dominaria United Art Series": "admu",
      "Dominaria United Minigames": "mdmu",
      "Dominaria United Commander Tokens": "tdmc",
      "Dominaria United Tokens": "tdmu",
      "Dominaria United": "dmu",
      "Dominaria United Jumpstart Front Cards": "fdmu",
      "30th Anniversary Play Promos": "p30a",
      "30th Anniversary Misc Promos": "p30m",
      "Summer Vacation Promos 2022": "psvc",
      "2021 Heroes of the Realm": "ph21",
      "Explorer Anthology 1": "ea1",
      "Historic Anthology 6": "ha6",
      "Store Championships": "sch",
      "Double Masters 2022": "2x2",
      "Double Masters 2022 Tokens": "t2x2",
      "Alchemy Horizons: Baldur's Gate": "hbg",
      "Love Your LGS 2022": "plg22",
      "Battle for Baldur's Gate Promos": "pclb",
      "Commander Legends: Battle for Baldur's Gate Minigames": "mclb",
      "Battle for Baldur's Gate Art Series": "aclb",
      "Battle for Baldur's Gate Tokens": "tclb",
      "Commander Legends: Battle for Baldur's Gate": "clb",
      "Alchemy: New Capenna": "ysnc",
      "Streets of New Capenna Southeast Asia Tokens": "ptsnc",
      "New Capenna Commander Promos": "pncc",
      "Streets of New Capenna Tokens": "tsnc",
      "Streets of New Capenna": "snc",
      "New Capenna Commander Tokens": "tncc",
      "New Capenna Commander": "ncc",
      "Streets of New Capenna Promos": "psnc",
      "Streets of New Capenna Minigames": "msnc",
      "New Capenna Art Series": "asnc",
      "Game Day Promos": "gdy",
      "Challenger Decks 2022": "q07",
      "Alchemy: Kamigawa": "yneo",
      "Wizards Play Network 2022": "pw22",
      "Universes Within": "slx",
      "Year of the Tiger 2022": "pl22",
      "Kamigawa: Neon Dynasty Promos": "pneo",
      "Kamigawa: Neon Dynasty Minigames": "mneo",
      "Kamigawa: Neon Dynasty Substitute Cards": "sneo",
      "Kamigawa: Neon Dynasty Tokens": "tneo",
      "Kamigawa: Neon Dynasty": "neo",
      "Neon Dynasty Commander Tokens": "tnec",
      "Neon Dynasty Commander": "nec",
      "Neon Dynasty Art Series": "aneo",
      "Commander Collection: Black": "cc2",
      "Innistrad: Double Feature": "dbl",
      "Judge Gift Cards 2022": "p22",
      "Alchemy: Innistrad": "ymid",
      "Innistrad: Crimson Vow Promos": "pvow",
      "Innistrad: Crimson Vow Tokens": "tvow",
      "Crimson Vow Commander Tokens": "tvoc",
      "Crimson Vow Commander Display Commanders": "ovoc",
      "Innistrad: Crimson Vow Minigames": "mvow",
      "Innistrad: Crimson Vow Substitute Cards": "svow",
      "Crimson Vow Art Series": "avow",
      "Innistrad: Crimson Vow": "vow",
      "Crimson Vow Commander": "voc",
      "Pioneer Challenger Decks 2021": "q06",
      "Innistrad: Midnight Hunt Substitute Cards": "smid",
      "Midnight Hunt Art Series": "amid",
      "Midnight Hunt Commander Tokens": "tmic",
      "Midnight Hunt Commander": "mic",
      "Midnight Hunt Commander Display Commanders": "omic",
      "Innistrad: Midnight Hunt Tokens": "tmid",
      "Innistrad: Midnight Hunt Promos": "pmid",
      "Innistrad: Midnight Hunt": "mid",
      "Innistrad: Midnight Hunt Minigames": "mmid",
      "Jumpstart: Historic Horizons": "j21",
      "Mystery Booster Playtest Cards 2021": "cmb2",
      "2020 Heroes of the Realm": "ph20",
      "Adventures in the Forgotten Realms Promos": "pafr",
      "Forgotten Realms Commander Display Commanders": "oafc",
      "Forgotten Realms Commander": "afc",
      "Adventures in the Forgotten Realms Art Series": "aafr",
      "Adventures in the Forgotten Realms Tokens": "tafr",
      "Forgotten Realms Commander Tokens": "tafc",
      "Adventures in the Forgotten Realms Minigames": "mafr",
      "Adventures in the Forgotten Realms": "afr",
      "Love Your LGS 2021": "plg21",
      "Modern Horizons 2 Promos": "pmh2",
      "Modern Horizons 2 Tokens": "tmh2",
      "Modern Horizons 2 Minigames": "mmh2",
      "Modern Horizons 2 Art Series": "amh2",
      "Modern Horizons 2": "mh2",
      "Wizards Play Network 2021": "pw21",
      "Modern Horizons 1 Timeshifts": "h1r",
      "Historic Anthology 5": "ha5",
      "Strixhaven: School of Mages Promos": "pstx",
      "Commander 2021 Tokens": "tc21",
      "Strixhaven: School of Mages Tokens": "tstx",
      "Strixhaven: School of Mages Substitute Cards": "sstx",
      "Strixhaven: School of Mages Minigames": "mstx",
      "Strixhaven Art Series": "astx",
      "Commander 2021 Display Commanders": "oc21",
      "Strixhaven: School of Mages": "stx",
      "Commander 2021": "c21",
      "Strixhaven Mystical Archive": "sta",
      "Time Spiral Remastered": "tsr",
      "Time Spiral Remastered Tokens": "ttsr",
      "Historic Anthology 4": "ha4",
      "Kaldheim Promos": "pkhm",
      "Kaldheim Minigames": "mkhm",
      "Kaldheim Substitute Cards": "skhm",
      "Kaldheim Commander Tokens": "tkhc",
      "Kaldheim Commander": "khc",
      "Kaldheim Art Series": "akhm",
      "Kaldheim Tokens": "tkhm",
      Kaldheim: "khm",
      "Year of the Ox 2021": "pl21",
      "Judge Gift Cards 2021": "pj21",
      "Commander Collection: Green": "cc1",
      "Commander Legends Tokens": "tcmr",
      "Commander Legends": "cmr",
      "Commander Legends Promos": "pcmr",
      "Kaladesh Remastered": "klr",
      "The List": "plst",
      "Zendikar Rising Promos": "pznr",
      "Zendikar Rising Commander Tokens": "tznc",
      "Zendikar Rising Substitute Cards": "sznr",
      "Zendikar Rising": "znr",
      "Zendikar Rising Commander": "znc",
      "Zendikar Rising Tokens": "tznr",
      "Zendikar Rising Minigames": "mznr",
      "Zendikar Rising Expeditions": "zne",
      "Zendikar Rising Art Series": "aznr",
      "Arena Beginner Set": "anb",
      "Amonkhet Remastered": "akr",
      "Double Masters": "2xm",
      "Double Masters Tokens": "t2xm",
      "2019 Heroes of the Realm": "ph19",
      "Jumpstart Arena Exclusives": "ajmp",
      Jumpstart: "jmp",
      "Core Set 2021 Promos": "pm21",
      "Core Set 2021 Tokens": "tm21",
      "Core Set 2021": "m21",
      "Signature Spellbook: Chandra": "ss3",
      "Jumpstart Front Cards": "fjmp",
      "Secret Lair: Ultimate Edition": "slu",
      "Historic Anthology 3": "ha3",
      "Love Your LGS 2020": "plg20",
      "Ikoria: Lair of Behemoths Promos": "piko",
      "Ikoria: Lair of Behemoths": "iko",
      "Ikoria: Lair of Behemoths Tokens": "tiko",
      "Commander 2020 Oversized": "oc20",
      "Commander 2020 Tokens": "tc20",
      "Commander 2020": "c20",
      "Historic Anthology 2": "ha2",
      "Unsanctioned Tokens": "tund",
      Unsanctioned: "und",
      "Theros Beyond Death Promos": "pthb",
      "Theros Beyond Death Tokens": "tthb",
      "Theros Beyond Death": "thb",
      "MagicFest 2020": "pf20",
      "Judge Gift Cards 2020": "j20",
      "Secret Lair Drop": "sld",
      "Historic Anthology 1": "ha1",
      "Game Night 2019 Tokens": "tgn2",
      "Game Night 2019": "gn2",
      "Mystery Booster Playtest Cards 2019": "cmb1",
      "Ponies: The Galloping": "ptg",
      "Throne of Eldraine Tokens": "teld",
      "Throne of Eldraine Promos": "peld",
      "Throne of Eldraine": "eld",
      "Planeswalker Championship Promos": "pwcs",
      "Commander 2019 Oversized": "oc19",
      "Commander 2019": "c19",
      "Commander 2019 Tokens": "tc19",
      "2018 Heroes of the Realm": "ph18",
      "San Diego Comic-Con 2019": "ps19",
      "Core Set 2020 Tokens": "tm20",
      "M20 Promo Packs": "ppp1",
      "Core Set 2020 Promos": "pm20",
      "Core Set 2020": "m20",
      "Signature Spellbook: Gideon": "ss2",
      "Modern Horizons Promos": "pmh1",
      "Modern Horizons": "mh1",
      "Modern Horizons Art Series": "amh1",
      "Modern Horizons Tokens": "tmh1",
      "War of the Spark Promos": "pwar",
      "War of the Spark Tokens": "twar",
      "War of the Spark": "war",
      "Judge Gift Cards 2019": "j19",
      "RNA Ravnica Weekend": "prw2",
      "RNA Guild Kit": "gk2",
      "RNA Guild Kit Tokens": "tgk2",
      "Ravnica Allegiance Promos": "prna",
      "Ravnica Allegiance": "rna",
      "Ravnica Allegiance Tokens": "trna",
      "MagicFest 2019": "pf19",
      "Planechase Anthology Planes": "opca",
      "Ultimate Box Topper": "puma",
      "Ultimate Masters": "uma",
      "Ultimate Masters Tokens": "tuma",
      "Game Night": "gnt",
      "M19 Gift Pack": "g18",
      "GRN Ravnica Weekend": "prwk",
      "GRN Guild Kit Tokens": "tgk1",
      "GRN Guild Kit": "gk1",
      "Guilds of Ravnica Tokens": "tgrn",
      "Guilds of Ravnica Promos": "pgrn",
      "Guilds of Ravnica": "grn",
      "Mythic Edition Tokens": "tmed",
      "Mythic Edition": "med",
      "Commander 2018 Oversized": "oc18",
      "Commander 2018 Tokens": "tc18",
      "Commander 2018": "c18",
      "2017 Heroes of the Realm": "ph17",
      "San Diego Comic-Con 2018": "ps18",
      "Arena New Player Experience Extras": "xana",
      "Arena New Player Experience": "ana",
      "MTG Arena Promos": "pana",
      "Arena New Player Experience Cards": "oana",
      "Core Set 2019 Promos": "pm19",
      "Core Set 2019 Tokens": "tm19",
      "Core Set 2019": "m19",
      "M19 Standard Showdown": "pss3",
      "Global Series Jiang Yanggu & Mu Yanling": "gs1",
      "Signature Spellbook: Jace": "ss1",
      "Battlebond Promos": "pbbd",
      "Battlebond Tokens": "tbbd",
      "Commander Anthology Volume II Tokens": "tcm2",
      "Commander Anthology Volume II": "cm2",
      Battlebond: "bbd",
      "Dominaria Promos": "pdom",
      Dominaria: "dom",
      "Dominaria Tokens": "tdom",
      "Duel Decks: Elves vs. Inventors Tokens": "tddu",
      "Duel Decks: Elves vs. Inventors": "ddu",
      "Masters 25": "a25",
      "Masters 25 Tokens": "ta25",
      "Lunar New Year 2018": "plny",
      "Nationals Promos": "pnat",
      "Rivals of Ixalan Tokens": "trix",
      "Rivals of Ixalan Promos": "prix",
      "Rivals of Ixalan": "rix",
      "Judge Gift Cards 2018": "j18",
      "Friday Night Magic 2018": "f18",
      "Unstable Promos": "pust",
      "Unstable Tokens": "tust",
      Unstable: "ust",
      "Iconic Masters Tokens": "tima",
      "XLN Treasure Chest": "pxtc",
      "Explorers of Ixalan": "e02",
      "From the Vault: Transform": "v17",
      "Iconic Masters": "ima",
      "Duel Decks: Merfolk vs. Goblins": "ddt",
      "Duel Decks: Merfolk vs. Goblins Tokens": "tddt",
      "2017 Gift Pack": "g17",
      "Ixalan Promos": "pxln",
      Ixalan: "xln",
      "Ixalan Tokens": "txln",
      "XLN Standard Showdown": "pss2",
      "HasCon 2017": "h17",
      "2016 Heroes of the Realm": "phtr",
      "Archenemy: Nicol Bolas Tokens": "te01",
      "Commander 2017 Oversized": "oc17",
      "Commander 2017": "c17",
      "Commander 2017 Tokens": "tc17",
      "San Diego Comic-Con 2017": "ps17",
      "Hour of Devastation Promos": "phou",
      "Hour of Devastation": "hou",
      "Hour of Devastation Tokens": "thou",
      "Archenemy: Nicol Bolas Schemes": "oe01",
      "Archenemy: Nicol Bolas": "e01",
      "Commander Anthology Tokens": "tcma",
      "Commander Anthology": "cma",
      "Amonkhet Promos": "pakh",
      "Amonkhet Tokens": "takh",
      "Amonkhet Invocations": "mp2",
      Amonkhet: "akh",
      "Welcome Deck 2017": "w17",
      "Duel Decks: Mind vs. Might Tokens": "tdds",
      "Duel Decks: Mind vs. Might": "dds",
      "Modern Masters 2017 Tokens": "tmm3",
      "Modern Masters 2017": "mm3",
      "Aether Revolt Promos": "paer",
      "Aether Revolt Tokens": "taer",
      "Aether Revolt": "aer",
      "League Tokens 2017": "l17",
      "Judge Gift Cards 2017": "j17",
      "Friday Night Magic 2017": "f17",
      "Planechase Anthology Tokens": "tpca",
      "Planechase Anthology": "pca",
      "Treasure Chest": "pz2",
      "Commander 2016 Oversized": "oc16",
      "Commander 2016 Tokens": "tc16",
      "Commander 2016": "c16",
      "San Diego Comic-Con 2016": "ps16",
      "Kaladesh Promos": "pkld",
      Kaladesh: "kld",
      "Kaladesh Tokens": "tkld",
      "Kaladesh Inventions": "mps",
      "Duel Decks: Nissa vs. Ob Nixilis": "ddr",
      "Conspiracy: Take the Crown Tokens": "tcn2",
      "Conspiracy: Take the Crown": "cn2",
      "From the Vault: Lore": "v16",
      "Eldritch Moon Promos": "pemn",
      "Eldritch Moon": "emn",
      "Eldritch Moon Tokens": "temn",
      "Eternal Masters Tokens": "tema",
      "Eternal Masters": "ema",
      "Shadows over Innistrad Promos": "psoi",
      "Shadows over Innistrad Tokens": "tsoi",
      "Shadows over Innistrad": "soi",
      "Welcome Deck 2016": "w16",
      "Duel Decks: Blessed vs. Cursed": "ddq",
      "Oath of the Gatewatch Tokens": "togw",
      "Oath of the Gatewatch": "ogw",
      "Oath of the Gatewatch Promos": "pogw",
      "League Tokens 2016": "l16",
      "Judge Gift Cards 2016": "j16",
      "Friday Night Magic 2016": "f16",
      "Legendary Cube Prize Pack": "pz1",
      "Commander 2015": "c15",
      "Commander 2015 Oversized": "oc15",
      "Commander 2015 Tokens": "tc15",
      "Battle for Zendikar Promos": "pbfz",
      "Battle for Zendikar Tokens": "tbfz",
      "BFZ Standard Series": "pss1",
      "Battle for Zendikar": "bfz",
      "Zendikar Expeditions": "exp",
      "Duel Decks: Zendikar vs. Eldrazi": "ddp",
      "From the Vault: Angels": "v15",
      "Magic Origins Clash Pack": "cp3",
      "Magic Origins Promos": "pori",
      "Magic Origins Tokens": "tori",
      "Magic Origins": "ori",
      "San Diego Comic-Con 2015": "ps15",
      "Modern Masters 2015 Tokens": "tmm2",
      "Modern Masters 2015": "mm2",
      "Tempest Remastered": "tpr",
      "Tarkir Dragonfury": "ptkdf",
      "Dragons of Tarkir Promos": "pdtk",
      "Dragons of Tarkir": "dtk",
      "Dragons of Tarkir Tokens": "tdtk",
      "Duel Decks: Elspeth vs. Kiora": "ddo",
      "Fate Reforged Promos": "pfrf",
      "Fate Reforged Clash Pack": "cp2",
      "Fate Reforged": "frf",
      "Fate Reforged Tokens": "tfrf",
      "Ugin's Fate": "ugin",
      "League Tokens 2015": "l15",
      "Friday Night Magic 2015": "f15",
      "Judge Gift Cards 2015": "j15",
      "Duel Decks Anthology: Jace vs. Chandra Tokens": "tjvc",
      "Duel Decks Anthology: Divine vs. Demonic Tokens": "tdvd",
      "Duel Decks Anthology: Garruk vs. Liliana Tokens": "tgvl",
      "Duel Decks Anthology: Jace vs. Chandra": "jvc",
      "Duel Decks Anthology: Garruk vs. Liliana": "gvl",
      "Duel Decks Anthology: Elves vs. Goblins Tokens": "tevg",
      "Duel Decks Anthology: Divine vs. Demonic": "dvd",
      "Duel Decks Anthology: Elves vs. Goblins": "evg",
      "Commander 2014 Oversized": "oc14",
      "Commander 2014": "c14",
      "Commander 2014 Tokens": "tc14",
      "Khans of Tarkir Promos": "pktk",
      "Khans of Tarkir": "ktk",
      "Khans of Tarkir Tokens": "tktk",
      "Duel Decks: Speed vs. Cunning": "ddn",
      "From the Vault: Annihilation": "v14",
      "Magic 2015 Clash Pack": "cp1",
      "Magic 2015": "m15",
      "Magic 2015 Tokens": "tm15",
      "Magic 2015 Promos": "pm15",
      "M15 Prerelease Challenge": "ppc1",
      "Duels of the Planeswalkers 2015 Promos": "pdp15",
      "San Diego Comic-Con 2014": "ps14",
      "Vintage Masters": "vma",
      "Conspiracy Promos": "pcns",
      "Conspiracy Tokens": "tcns",
      Conspiracy: "cns",
      "Modern Event Deck 2014": "md1",
      "Modern Event Deck 2014 Tokens": "tmd1",
      "Defeat a God": "tdag",
      "Journey into Nyx Tokens": "tjou",
      "Journey into Nyx": "jou",
      "Journey into Nyx Hero's Path": "thp3",
      "Journey into Nyx Promos": "pjou",
      "Duel Decks: Jace vs. Vraska": "ddm",
      "Duel Decks: Jace vs. Vraska Tokens": "tddm",
      "Battle the Horde": "tbth",
      "Born of the Gods Hero's Path": "thp2",
      "Born of the Gods Tokens": "tbng",
      "Born of the Gods": "bng",
      "Born of the Gods Promos": "pbng",
      "League Tokens 2014": "l14",
      "Friday Night Magic 2014": "f14",
      "Judge Gift Cards 2014": "j14",
      "Commander 2013 Oversized": "oc13",
      "Commander 2013": "c13",
      "Face the Hydra": "tfth",
      "Theros Tokens": "tths",
      Theros: "ths",
      "Theros Hero's Path": "thp1",
      "Theros Promos": "pths",
      "Duel Decks: Heroes vs. Monsters": "ddl",
      "Duel Decks: Heroes vs. Monsters Tokens": "tddl",
      "From the Vault: Twenty": "v13",
      "Magic 2014": "m14",
      "Magic 2014 Tokens": "tm14",
      "Magic 2014 Promos": "pm14",
      "San Diego Comic-Con 2013": "psdc",
      "Modern Masters": "mma",
      "Modern Masters Tokens": "tmma",
      "Dragon's Maze": "dgm",
      "Dragon's Maze Tokens": "tdgm",
      "Dragon's Maze Promos": "pdgm",
      "World Magic Cup Qualifiers": "wmc",
      "Duel Decks: Sorin vs. Tibalt Tokens": "tddk",
      "Duel Decks: Sorin vs. Tibalt": "ddk",
      Gatecrash: "gtc",
      "Gatecrash Tokens": "tgtc",
      "Gatecrash Promos": "pgtc",
      "Duels of the Planeswalkers 2014 Promos": "pdp14",
      "League Tokens 2013": "l13",
      "Friday Night Magic 2013": "f13",
      "Judge Gift Cards 2013": "j13",
      "Commander's Arsenal Oversized": "ocm1",
      "Commander's Arsenal": "cm1",
      "Return to Ravnica": "rtr",
      "Return to Ravnica Promos": "prtr",
      "Return to Ravnica Tokens": "trtr",
      "Duel Decks: Izzet vs. Golgari Tokens": "tddj",
      "Duel Decks: Izzet vs. Golgari": "ddj",
      "From the Vault: Realms": "v12",
      "Magic 2013": "m13",
      "Magic 2013 Tokens": "tm13",
      "Magic 2013 Promos": "pm13",
      "Planechase 2012 Planes": "opc2",
      "Planechase 2012": "pc2",
      "Avacyn Restored": "avr",
      "Avacyn Restored Tokens": "tavr",
      "Open the Helvault": "phel",
      "Avacyn Restored Promos": "pavr",
      "Duel Decks: Venser vs. Koth": "ddi",
      "Duel Decks: Venser vs. Koth Tokens": "tddi",
      "Dark Ascension Tokens": "tdka",
      "Dark Ascension": "dka",
      "Dark Ascension Promos": "pdka",
      "Wizards Play Network 2012": "pw12",
      "Duels of the Planeswalkers 2013 Promos": "pdp13",
      "IDW Comics Inserts": "pidw",
      "League Tokens 2012": "l12",
      "Friday Night Magic 2012": "f12",
      "Judge Gift Cards 2012": "j12",
      "Premium Deck Series: Graveborn": "pd3",
      Innistrad: "isd",
      "Innistrad Tokens": "tisd",
      "Innistrad Promos": "pisd",
      "Duel Decks: Ajani vs. Nicol Bolas Tokens": "tddh",
      "Duel Decks: Ajani vs. Nicol Bolas": "ddh",
      "From the Vault: Legends": "v11",
      "Magic 2012 Tokens": "tm12",
      "Magic 2012": "m12",
      "Magic 2012 Promos": "pm12",
      "Commander 2011 Oversized": "ocmd",
      "Commander 2011": "cmd",
      "Commander 2011 Launch Party": "pcmd",
      "Duel Decks: Mirrodin Pure vs. New Phyrexia": "td2",
      "New Phyrexia Tokens": "tnph",
      "New Phyrexia": "nph",
      "New Phyrexia Promos": "pnph",
      "Duel Decks: Knights vs. Dragons": "ddg",
      "Duel Decks: Knights vs. Dragons Tokens": "tddg",
      "Mirrodin Besieged Tokens": "tmbs",
      "Mirrodin Besieged": "mbs",
      "Mirrodin Besieged Promos": "pmbs",
      "Masters Edition IV": "me4",
      "Magic Premiere Shop 2011": "pmps11",
      "Wizards Play Network 2011": "pw11",
      "Duels of the Planeswalkers 2012 Promos": "pdp12",
      "Friday Night Magic 2011": "f11",
      "Judge Gift Cards 2011": "g11",
      "Legacy Championship": "olgc",
      "Magic Player Rewards 2011": "p11",
      "Salvat 2011": "ps11",
      "Premium Deck Series: Fire and Lightning": "pd2",
      "Magic Online Theme Decks": "td0",
      "Scars of Mirrodin": "som",
      "Scars of Mirrodin Tokens": "tsom",
      "Scars of Mirrodin Promos": "psom",
      "Duel Decks: Elspeth vs. Tezzeret": "ddf",
      "Duel Decks: Elspeth vs. Tezzeret Tokens": "tddf",
      "From the Vault: Relics": "v10",
      "Magic 2011": "m11",
      "Magic 2011 Tokens": "tm11",
      "Magic 2011 Promos": "pm11",
      "Archenemy Schemes": "oarc",
      Archenemy: "arc",
      "Duels of the Planeswalkers": "dpa",
      "Rise of the Eldrazi Promos": "proe",
      "Rise of the Eldrazi Tokens": "troe",
      "Rise of the Eldrazi": "roe",
      "Duel Decks: Phyrexia vs. the Coalition Tokens": "tdde",
      "Duel Decks: Phyrexia vs. the Coalition": "dde",
      "Worldwake Promos": "pwwk",
      "Worldwake Tokens": "twwk",
      Worldwake: "wwk",
      "Duels of the Planeswalkers 2010 Promos": "pdp10",
      "Magic Premiere Shop 2010": "pmps10",
      "Magic Player Rewards 2010": "p10",
      "Friday Night Magic 2010": "f10",
      "Judge Gift Cards 2010": "g10",
      "Premium Deck Series: Slivers": "h09",
      "Duel Decks: Garruk vs. Liliana": "ddd",
      "Duel Decks: Garruk vs. Liliana Tokens": "tddd",
      "Zendikar Promos": "pzen",
      Zendikar: "zen",
      "Zendikar Tokens": "tzen",
      "Masters Edition III": "me3",
      "Planechase Planes": "ohop",
      Planechase: "hop",
      "Planechase Promos": "phop",
      "From the Vault: Exiled": "v09",
      "Magic 2010": "m10",
      "Magic 2010 Tokens": "tm10",
      "Magic 2010 Promos": "pm10",
      "Alara Reborn Promos": "parb",
      "Alara Reborn": "arb",
      "Alara Reborn Tokens": "tarb",
      "Duel Decks: Divine vs. Demonic": "ddc",
      "Duel Decks: Divine vs. Demonic Tokens": "tddc",
      "URL/Convention Promos": "purl",
      "Conflux Promos": "pcon",
      Conflux: "con",
      "Conflux Tokens": "tcon",
      "Duels of the Planeswalkers 2009 Promos": "pdtp",
      "Magic Premiere Shop 2009": "pmps09",
      "Friday Night Magic 2009": "f09",
      "Magic Player Rewards 2009": "p09",
      "Judge Gift Cards 2009": "g09",
      "Duel Decks: Jace vs. Chandra": "dd2",
      "Duel Decks: Jace vs. Chandra Tokens": "tdd2",
      "Shards of Alara Promos": "pala",
      "Shards of Alara Tokens": "tala",
      "Shards of Alara": "ala",
      "Masters Edition II": "me2",
      "From the Vault: Dragons": "drb",
      "Eventide Promos": "peve",
      "Eventide Tokens": "teve",
      Eventide: "eve",
      "Shadowmoor Promos": "pshm",
      Shadowmoor: "shm",
      "Shadowmoor Tokens": "tshm",
      "15th Anniversary Cards": "p15a",
      "Morningtide Promos": "pmor",
      Morningtide: "mor",
      "Morningtide Tokens": "tmor",
      "Magic Premiere Shop 2008": "pmps08",
      "Judge Gift Cards 2008": "g08",
      "Magic Player Rewards 2008": "p08",
      "Friday Night Magic 2008": "f08",
      "Duel Decks: Elves vs. Goblins Tokens": "tdd1",
      "Duel Decks: Elves vs. Goblins": "dd1",
      "Lorwyn Promos": "plrw",
      Lorwyn: "lrw",
      "Lorwyn Tokens": "tlrw",
      "Masters Edition": "me1",
      "Tenth Edition": "10e",
      "Tenth Edition Promos": "p10e",
      "Tenth Edition Tokens": "t10e",
      "Future Sight Promos": "pfut",
      "Future Sight": "fut",
      "Grand Prix Promos": "pgpx",
      "Pro Tour Promos": "ppro",
      "Planar Chaos Promos": "pplc",
      "Planar Chaos": "plc",
      "Magic Premiere Shop 2007": "pmps07",
      "Magic Player Rewards 2007": "p07",
      "Judge Gift Cards 2007": "g07",
      "Friday Night Magic 2007": "f07",
      "Happy Holidays": "hho",
      "Time Spiral Promos": "ptsp",
      "Time Spiral Timeshifted": "tsb",
      "Time Spiral": "tsp",
      "Coldsnap Promos": "pcsp",
      Coldsnap: "csp",
      "Coldsnap Theme Decks": "cst",
      "Dissension Promos": "pdis",
      Dissension: "dis",
      "Champs and States": "pcmp",
      "Guildpact Promos": "pgpt",
      Guildpact: "gpt",
      "Magic Premiere Shop 2006": "pmps06",
      "Arena League 2006": "pal06",
      "Junior APAC Series": "pjas",
      "DCI Promos": "dci",
      "Judge Gift Cards 2006": "g06",
      "Hachette UK": "phuk",
      "Friday Night Magic 2006": "f06",
      "Magic Player Rewards 2006": "p06",
      "Two-Headed Giant Tournament": "p2hg",
      "Magic Premiere Shop 2005": "pmps",
      "Ravnica: City of Guilds Promos": "prav",
      "Ravnica: City of Guilds": "rav",
      "Salvat 2005": "psal",
      "Ninth Edition Promos": "p9ed",
      "Ninth Edition": "9ed",
      "Saviors of Kamigawa Promos": "psok",
      "Saviors of Kamigawa": "sok",
      "Betrayers of Kamigawa Promos": "pbok",
      "Betrayers of Kamigawa": "bok",
      "Arena League 2005": "pal05",
      "Junior Series Europe": "pjse",
      "Friday Night Magic 2005": "f05",
      "Judge Gift Cards 2005": "g05",
      "Magic Player Rewards 2005": "p05",
      "Unhinged Promos": "punh",
      Unhinged: "unh",
      "Champions of Kamigawa Promos": "pchk",
      "Champions of Kamigawa": "chk",
      "World Championship Decks 2004": "wc04",
      "Mirrodin Promos": "pmrd",
      "Fifth Dawn Promos": "p5dn",
      "Fifth Dawn": "5dn",
      "Darksteel Promos": "pdst",
      Darksteel: "dst",
      "Arena League 2004": "pal04",
      "Friday Night Magic 2004": "f04",
      "Judge Gift Cards 2004": "g04",
      "Magic Player Rewards 2004": "p04",
      Mirrodin: "mrd",
      "World Championship Decks 2003": "wc03",
      "Eighth Edition Promos": "p8ed",
      "Eighth Edition": "8ed",
      "Scourge Promos": "pscg",
      Scourge: "scg",
      "Legions Promos": "plgn",
      Legions: "lgn",
      "Magic Online Avatars": "pmoa",
      "Japan Junior Tournament": "pjjt",
      "Arena League 2003": "pal03",
      "Vintage Championship": "ovnt",
      "Judge Gift Cards 2003": "g03",
      "Magic Player Rewards 2003": "p03",
      "Friday Night Magic 2003": "f03",
      Onslaught: "ons",
      "Onslaught Promos": "pons",
      "World Championship Decks 2002": "wc02",
      "Hobby Japan Promos": "jp1",
      "Magic Online Promos": "prm",
      "Judgment Promos": "pjud",
      Judgment: "jud",
      "Torment Promos": "ptor",
      Torment: "tor",
      "Arena League 2002": "pal02",
      "Judge Gift Cards 2002": "g02",
      "Magic Player Rewards 2002": "pr2",
      "Friday Night Magic 2002": "f02",
      Deckmasters: "dkm",
      "Odyssey Promos": "pody",
      Odyssey: "ody",
      "World Championship Decks 2001": "wc01",
      "Sega Dreamcast Cards": "psdg",
      "Apocalypse Promos": "papc",
      Apocalypse: "apc",
      "Seventh Edition": "7ed",
      "Planeshift Promos": "ppls",
      Planeshift: "pls",
      "Arena League 2001": "pal01",
      "Friday Night Magic 2001": "f01",
      "Magic Player Rewards 2001": "mpr",
      "Judge Gift Cards 2001": "g01",
      "Invasion Promos": "pinv",
      Invasion: "inv",
      "Beatdown Box Set": "btd",
      "World Championship Decks 2000": "wc00",
      "Prophecy Promos": "ppcy",
      Prophecy: "pcy",
      "Starter 2000": "s00",
      "Nemesis Promos": "pnem",
      Nemesis: "nem",
      "European Land Program": "pelp",
      "Arena League 2000": "pal00",
      "Friday Night Magic 2000": "fnm",
      "Judge Gift Cards 2000": "g00",
      "Junior Super Series": "psus",
      "Battle Royale Box Set": "brb",
      "Mercadian Masques Promos": "pmmq",
      "Mercadian Masques": "mmq",
      "Wizards of the Coast Online Store": "pwos",
      "World Championship Decks 1999": "wc99",
      "World Championship Promos": "pwor",
      Guru: "pgru",
      "Starter 1999": "s99",
      "Urza's Destiny Promos": "puds",
      "Urza's Destiny": "uds",
      "Portal: Three Kingdoms Promos": "pptk",
      "Portal Three Kingdoms": "ptk",
      "Classic Sixth Edition": "6ed",
      "Urza's Legacy Promos": "pulg",
      "Urza's Legacy": "ulg",
      "Arena League 1999": "pal99",
      "Judge Gift Cards 1999": "g99",
      Anthologies: "ath",
      "Urza's Saga Promos": "pusg",
      "Urza's Saga": "usg",
      "Asia Pacific Land Program": "palp",
      "World Championship Decks 1998": "wc98",
      "Unglued Tokens": "tugl",
      Unglued: "ugl",
      "Portal Second Age": "p02",
      "Exodus Promos": "pexo",
      Exodus: "exo",
      "Stronghold Promos": "psth",
      Stronghold: "sth",
      "Judge Gift Cards 1998": "jgp",
      "Tempest Promos": "ptmp",
      Tempest: "tmp",
      "World Championship Decks 1997": "wc97",
      Weatherlight: "wth",
      "Oversized League Prizes": "olep",
      Portal: "por",
      "Vanguard Series": "pvan",
      "MicroProse Promos": "pmic",
      "Astral Cards": "past",
      "Fifth Edition": "5ed",
      Visions: "vis",
      "Introductory Two-Player Set": "itp",
      "Multiverse Gift Box": "mgb",
      Mirage: "mir",
      "Redemption Program": "pred",
      "Celebration Cards": "pcel",
      "Arena League 1996": "parl",
      "DCI Legend Membership": "plgm",
      "Rivals Quick Start Set": "rqs",
      Alliances: "all",
      "Pro Tour Collector Set": "ptc",
      "Oversized 90's Promos": "o90p",
      Homelands: "hml",
      Rinascimento: "rin",
      Renaissance: "ren",
      "Chronicles Foreign Black Border": "bchr",
      Chronicles: "chr",
      "Ice Age": "ice",
      "Fourth Edition Foreign Black Border": "4bb",
      "Fourth Edition": "4ed",
      "Media and Collaboration Promos": "pmei",
      "Fallen Empires": "fem",
      "HarperPrism Book Promos": "phpr",
      "The Dark": "drk",
      "Dragon Con": "pdrc",
      "Summer Magic / Edgar": "sum",
      Legends: "leg",
      "Revised Edition": "3ed",
      "Foreign Black Border": "fbb",
      Antiquities: "atq",
      "Arabian Nights": "arn",
      "Intl. Collectors' Edition": "cei",
      "Collectors' Edition": "ced",
      "Unlimited Edition": "2ed",
      "Limited Edition Beta": "leb",
      "Limited Edition Alpha": "lea",
      "Commander: Ikoria": "c20",
      "Commander: Strixhaven": "c21",
    };

    // Function to convert set name to set code (lowercase for Moxfield)
    function getSetCode(expansionName) {
      if (!expansionName) return "";

      // First, try exact match
      if (setNameToCodeMapping[expansionName]) {
        return setNameToCodeMapping[expansionName];
      }

      // Try partial matches for sets with different naming conventions
      for (const [setName, setCode] of Object.entries(setNameToCodeMapping)) {
        if (
          expansionName.includes(setName) ||
          setName.includes(expansionName)
        ) {
          return setCode;
        }
      }

      // If no match found, return lowercase version of original name
      console.log(`No set code mapping found for: ${expansionName}`);
      return expansionName.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    // Moxfield condition mapping (using short forms)
    const conditionsToMoxfield = {
      1: "M", // Mint
      2: "NM", // Near Mint
      3: "NM", // Near Mint (treating both 2 and 3 as NM)
      4: "LP", // Good (Lightly Played) -> Lightly Played
      5: "MP", // Played -> Moderately Played
      6: "HP", // Heavily Played
      7: "D", // Poor -> Damaged
    };

    // Moxfield language mapping (using short codes)
    const languagesToMoxfield = {
      1: "en", // English
      2: "fr", // French
      3: "de", // German
      4: "es", // Spanish
      5: "it", // Italian
      6: "zhs", // Simplified Chinese
      7: "ja", // Japanese
      8: "pt", // Portuguese
      9: "ru", // Russian
      10: "ko", // Korean
      11: "zht", // Traditional Chinese
    };

    var arrArticles = [];
    _j$("table[id^=ArticleTable]>tbody tr").each(function (index) {
      // get rid of (V.1) and other confusing character sequences
      let regex =
        game == "magic"
          ? cardNameRegexClean // removes stuff like (V.1) and other weird sequences
          : /(.*)/; // keeps everything, FaB uses that to indicate colours and foilings

      var pName = regex
        .exec(_j$(this).data("name"))[1]
        .replace("Æ", "Ae")
        .replace("æ", "ae")
        .trim();
      var expansionName = _j$(this).data("expansion-name");
      var setCode = getSetCode(expansionName);
      var condition = conditionsToMoxfield[_j$(this).data("condition")] || "NM";
      var language = languagesToMoxfield[_j$(this).data("language")] || "en";
      var foilStatus = _j$(this).has('div.col-extras span[aria-label="Foil"]')
        .length
        ? "foil"
        : "";
      var collectorNumber = _j$(this).data("number") || "";
      var price = _j$(this).data("price")
        ? parseFloat(_j$(this).data("price")).toFixed(2)
        : "";

      // Moxfield CSV format - exact column headers as specified
      arrArticles.push({
        Count: _j$(this).data("amount"),
        Name: pName,
        Edition: setCode,
        Condition: condition,
        Language: language,
        Foil: foilStatus,
        "Collector Number": collectorNumber,
        Alter: "FALSE",
        "Playtest Card": "FALSE",
        "Purchase Price": price,
      });
    });

    _j$("#collapsibleExport p.font-italic.small").text(
      "Click here to export your articles to a CSV document or copy them to clipboard."
    );
    _j$("#collapsibleExport").append(
      `<input id="exportToText" type="submit" value="Copy to Clipboard" title="Copy order contents as plain text to clipboard" class="btn my-2 btn-block btn-sm btn-outline-primary"><span id="custom-tooltip">Copied!</span>`
    );

    // Add Moxfield export button
    _j$("#collapsibleExport").append(
      `<input id="exportToMoxfield" type="submit" value="Export (Moxfield CSV)" title="Export to Moxfield CSV format" class="btn my-2 btn-block btn-sm btn-outline-primary">`
    );
    _j$("#collapsibleMemo").append(
      `<input id="exportToMoxfield" type="submit" value="Export (Moxfield CSV)" title="Export to Moxfield CSV format" class="btn my-2 btn-block btn-sm btn-outline-primary">`
    );

    _j$("#exportToMoxfield").on("click", function (e) {
      let headers = [
        "Count",
        "Name",
        "Edition",
        "Condition",
        "Language",
        "Foil",
        "Collector Number",
        "Alter",
        "Playtest Card",
        "Purchase Price",
      ];
      let orderId = _j$(".page-title-container h1")
        .text()
        .replace(/[^0-9]*/, "");
      window.exportMoxfieldCSV(
        headers,
        arrArticles,
        `MKM Order ${orderId} - Moxfield`
      );
    });

    /**
     * Keep original Deckbox export for MTG if needed
     */
    if (game == "magic") {
      _j$("#collapsibleExport").append(
        `<input id="exportToDeckbox" type="submit" value="Export (Deckbox.org)" title="Export to Deckbox.org CSV" class="btn my-2 btn-block btn-sm btn-outline-primary">`
      );
      _j$("#exportToDeckbox").on("click", function (e) {
        // Use original format for Deckbox
        let deckboxArticles = [];
        _j$("table[id^=ArticleTable]>tbody tr").each(function (index) {
          let regex = game == "magic" ? cardNameRegexClean : /(.*)/;
          var pName = regex
            .exec(_j$(this).data("name"))[1]
            .replace("Æ", "Ae")
            .replace("æ", "ae")
            .trim();

          deckboxArticles.push({
            Count: _j$(this).data("amount"),
            Name: '"' + pName + '"',
            Edition: '"' + _j$(this).data("expansion-name") + '"',
            "Card Number": _j$(this).data("number"),
            Condition: [
              "",
              "Mint",
              "Near Mint",
              "Near Mint",
              "Good (Lightly Played)",
              "Played",
              "Heavily Played",
              "Poor",
            ][_j$(this).data("condition")],
            Language: [
              "",
              "English",
              "French",
              "German",
              "Spanish",
              "Italian",
              "Simplified Chinese",
              "Japanese",
              "Portuguese",
              "Russian",
              "Korean",
              "Traditional Chinese",
            ][_j$(this).data("language")],
            Foil: _j$(this).has('div.col-extras span[aria-label="Foil"]')
              .length,
            Price: _j$(this).data("price"),
          });
        });

        let headers = Object.keys(deckboxArticles[0]);
        let orderId = _j$(".page-title-container h1")
          .text()
          .replace(/[^0-9]*/, "");
        window.exportCSVFile(
          headers,
          deckboxArticles,
          `MKM Order ${orderId}`,
          true
        );
      });
    }

    _j$("#exportToText").on("click", function (e) {
      window.exportToText(arrArticles);
    });
  })();

  // Add Moxfield CSV export function
  window.exportMoxfieldCSV = function (headers, items, fileTitle) {
    let csvContent = "";

    // Add headers with proper quoting
    csvContent += headers.map((header) => `"${header}"`).join(",") + "\r\n";

    // Add data rows
    items.forEach((item) => {
      let row = headers
        .map((header) => {
          let value = item[header] || "";
          // Quote all values to ensure proper CSV formatting
          return `"${value}"`;
        })
        .join(",");
      csvContent += row + "\r\n";
    });

    var exportedFilename = fileTitle + ".csv" || "moxfield-export.csv";
    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, exportedFilename);
    } else {
      var link = document.createElement("a");
      if (link.download !== undefined) {
        // feature detection
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", exportedFilename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };
})();

/***********************************************************************
 * JSON2CSV converter by dannypule (https://gist.github.com/dannypule) *
 ***********************************************************************/
window.convertToCSV = function (objArray) {
  var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
  var str = "";

  for (var i = 0; i < array.length; i++) {
    var line = "";
    for (var index in array[i]) {
      if (line != "") line += ",";
      line += array[i][index];
    }
    str += line + "\r\n";
  }

  return str;
};

window.exportCSVFile = function (headers, items, fileTitle) {
  let csvArray = Array.from(items);
  if (headers) {
    csvArray.unshift(headers);
  }

  // Convert Object to JSON
  var jsonObject = JSON.stringify(csvArray);
  var csv = this.convertToCSV(jsonObject);

  var exportedFilename = fileTitle + ".csv" || "export.csv";

  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, exportedFilename);
  } else {
    var link = document.createElement("a");
    if (link.download !== undefined) {
      // feature detection
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", exportedFilename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

window.exportToText = function (objArray, useMTGAFormat) {
  // useMTGAFormat = useMTGAFormat ?? false;
  var array = typeof objArray != "object" ? JSON.parse(objArray) : objArray;
  var str = "";
  // var sets = window.mtgSets;

  array.forEach((article) => {
    var line =
      article.Count +
      " " +
      article.Name.replace(/"*/g, "").replace("Æ", "Ae").replace("æ", "ae");
    str += line + "\r\n";
  });

  window.writeToClipboard(str, function () {
    document.getElementById("custom-tooltip").classList.toggle("visible");
    setTimeout(function () {
      document.getElementById("custom-tooltip").classList.toggle("visible");
    }, 2000);
  });
};
