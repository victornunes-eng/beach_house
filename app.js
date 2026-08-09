(function () {
  const STORAGE_KEY = "missao-praia-ranking-v1";
  const root = document.getElementById("listings");
  const empty = document.getElementById("empty");
  const cityNav = document.getElementById("city-nav");
  const rankList = document.getElementById("rank-list");
  const rankEmpty = document.getElementById("rank-empty");
  const rankNameInput = document.getElementById("rank-name");
  const copyBtn = document.getElementById("copy-rank");
  const clearBtn = document.getElementById("clear-rank");
  const copyFeedback = document.getElementById("copy-feedback");

  const listings = Array.isArray(window.LISTINGS) ? window.LISTINGS : [];
  const byId = new Map(listings.map((item) => [String(item.id), item]));

  const statusLabel = {
    avaliando: "Avaliando",
    favorita: "Favorita",
    descartada: "Descartada",
  };

  let state = loadState();

  if (!listings.length) {
    empty.classList.remove("hidden");
  } else {
    renderCities();
  }

  if (rankNameInput) {
    rankNameInput.value = state.nome || "";
    rankNameInput.addEventListener("input", () => {
      state.nome = rankNameInput.value.trim();
      saveState();
    });
  }

  if (copyBtn) copyBtn.addEventListener("click", copyRankingMessage);
  if (clearBtn) clearBtn.addEventListener("click", clearRanking);

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-rank-action]");
    if (!btn) return;

    const id = String(btn.getAttribute("data-id") || "");
    const action = btn.getAttribute("data-rank-action");
    if (!id || !byId.has(id)) return;

    if (action === "add") addToRanking(id);
    if (action === "up") moveInRanking(id, -1);
    if (action === "down") moveInRanking(id, 1);
    if (action === "remove") removeFromRanking(id);
  });

  renderRanking();
  syncListingControls();

  function renderCities() {
    const statusOrder = { favorita: 0, avaliando: 1, descartada: 2 };
    const byCity = new Map();

    listings.forEach((item) => {
      const city = item.cidade || "Outras";
      if (!byCity.has(city)) byCity.set(city, []);
      byCity.get(city).push(item);
    });

    const cities = [...byCity.keys()].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );

    if (cityNav) {
      cityNav.innerHTML = cities
        .map((city) => {
          const count = byCity.get(city).length;
          return `<a href="#cidade-${slugify(city)}">${escapeHtml(
            city
          )} <span>${count}</span></a>`;
        })
        .join("");
    }

    const frag = document.createDocumentFragment();
    let index = 0;

    cities.forEach((city) => {
      const section = document.createElement("section");
      section.className = "city-group";
      section.id = `cidade-${slugify(city)}`;

      const items = [...byCity.get(city)].sort(
        (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
      );

      const head = document.createElement("div");
      head.className = "city-head";
      head.innerHTML = `
        <h3>${escapeHtml(city)}</h3>
        <p>${items.length} ${items.length === 1 ? "casa" : "casas"}</p>
      `;
      section.appendChild(head);

      const list = document.createElement("div");
      list.className = "city-listings";

      items.forEach((item) => {
        list.appendChild(renderListing(item, index));
        index += 1;
      });

      section.appendChild(list);
      frag.appendChild(section);
    });

    root.appendChild(frag);
  }

  function renderListing(item, index) {
    const article = document.createElement("article");
    article.className = `listing listing--${item.status || "avaliando"}`;
    article.dataset.listingId = String(item.id);
    article.style.setProperty("--i", String(index));

    const facts = [
      item.pessoas ? `${item.pessoas} hóspedes` : null,
      item.quartos ? `${item.quartos} quartos` : null,
      item.camas ? `${item.camas} camas` : null,
      item.banheiros ? `${item.banheiros} banheiros` : null,
    ].filter(Boolean);

    let rating = null;
    if (item.nota != null && item.avaliacoes) {
      rating = `★ ${formatNum(item.nota)} · ${item.avaliacoes} avaliações`;
    } else if (!item.avaliacoes) {
      rating = "Ainda sem avaliações";
    }

    const thumbs = (item.fotos || []).slice(0, 4);
    const place = [item.local, item.cidade].filter(Boolean).join(", ");

    article.innerHTML = `
      ${
        item.foto
          ? `<a class="listing-photo" href="${escapeAttr(
              item.link || item.foto
            )}" target="_blank" rel="noopener noreferrer">
              <img src="${escapeAttr(item.foto)}" alt="${escapeAttr(
                item.nome || "Foto da casa"
              )}" loading="lazy" />
            </a>`
          : ""
      }

      <div class="listing-body">
        <div class="listing-top">
          <span class="status">${statusLabel[item.status] || "Avaliando"}</span>
          <h3>${escapeHtml(item.nome || "Sem nome")}</h3>
          <p class="meta">
            ${escapeHtml(
              [item.tipo, place, rating].filter(Boolean).join(" · ")
            )}
          </p>
        </div>

        ${
          facts.length
            ? `<p class="facts">${escapeHtml(facts.join(" · "))}</p>`
            : ""
        }

        ${
          item.periodo || item.preco || item.hospedesBusca
            ? `<div class="trip">
                ${
                  item.periodo
                    ? `<p><span>Período</span>${escapeHtml(item.periodo)}${
                        item.noites ? ` (${item.noites} noites)` : ""
                      }</p>`
                    : ""
                }
                ${
                  item.hospedesBusca
                    ? `<p><span>Busca</span>${escapeHtml(
                        item.hospedesBusca
                      )}</p>`
                    : ""
                }
                ${
                  item.preco
                    ? `<p><span>Preço</span>${escapeHtml(item.preco)}</p>`
                    : ""
                }
                ${
                  item.checkin || item.checkout
                    ? `<p><span>Check-in / out</span>${escapeHtml(
                        [item.checkin, item.checkout]
                          .filter(Boolean)
                          .join(" · ")
                      )}</p>`
                    : ""
                }
                ${
                  item.anfitria
                    ? `<p><span>Anfitriã</span>${escapeHtml(
                        item.anfitria
                      )}</p>`
                    : ""
                }
              </div>`
            : ""
        }

        ${
          item.descricao
            ? `<p class="descricao">${escapeHtml(item.descricao)}</p>`
            : ""
        }

        ${
          thumbs.length > 1
            ? `<div class="thumbs">
                ${thumbs
                  .map(
                    (src) =>
                      `<img src="${escapeAttr(src)}" alt="" loading="lazy" />`
                  )
                  .join("")}
              </div>`
            : ""
        }

        ${
          item.comodidades?.length
            ? `<div class="block">
                <h4>Comodidades</h4>
                <ul class="chips">
                  ${item.comodidades
                    .map((c) => `<li>${escapeHtml(c)}</li>`)
                    .join("")}
                </ul>
              </div>`
            : ""
        }

        ${
          item.regras?.length
            ? `<div class="block">
                <h4>Regras</h4>
                <ul class="rules">
                  ${item.regras
                    .map((r) => `<li>${escapeHtml(r)}</li>`)
                    .join("")}
                </ul>
              </div>`
            : ""
        }

        ${
          item.avaliacoesDetalhe
            ? `<div class="block">
                <h4>Avaliações</h4>
                <ul class="ratings">
                  ${Object.entries(item.avaliacoesDetalhe)
                    .map(
                      ([key, value]) =>
                        `<li><span>${escapeHtml(
                          ratingLabel(key)
                        )}</span><strong>${formatNum(value)}</strong></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : ""
        }

        ${
          item.notas
            ? `<p class="notas"><strong>Notas do grupo:</strong> ${escapeHtml(
                item.notas
              )}</p>`
            : ""
        }

        <div class="listing-footer">
          ${
            item.link
              ? `<a class="listing-link" href="${escapeAttr(
                  item.link
                )}" target="_blank" rel="noopener noreferrer">Abrir no Airbnb</a>`
              : "<span></span>"
          }
          <div class="rank-controls" data-listing-controls="${escapeAttr(
            String(item.id)
          )}"></div>
        </div>
      </div>
    `;

    return article;
  }

  function addToRanking(id) {
    if (state.order.includes(id)) return;
    state.order.push(id);
    persistAndRefresh();
  }

  function removeFromRanking(id) {
    state.order = state.order.filter((itemId) => itemId !== id);
    persistAndRefresh();
  }

  function moveInRanking(id, delta) {
    const index = state.order.indexOf(id);
    if (index < 0) return;
    const next = index + delta;
    if (next < 0 || next >= state.order.length) return;
    const copy = [...state.order];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    state.order = copy;
    persistAndRefresh();
  }

  function clearRanking() {
    if (!state.order.length) return;
    if (!confirm("Limpar todo o seu ranking neste aparelho?")) return;
    state.order = [];
    persistAndRefresh();
    showFeedback("Ranking limpo.");
  }

  function persistAndRefresh() {
    saveState();
    renderRanking();
    syncListingControls();
  }

  function renderRanking() {
    if (!rankList || !rankEmpty) return;

    const validOrder = state.order.filter((id) => byId.has(id));
    if (validOrder.length !== state.order.length) {
      state.order = validOrder;
      saveState();
    }

    if (!validOrder.length) {
      rankList.innerHTML = "";
      rankEmpty.hidden = false;
      return;
    }

    rankEmpty.hidden = true;
    rankList.innerHTML = validOrder
      .map((id, index) => {
        const item = byId.get(id);
        const place = [item.local, item.cidade].filter(Boolean).join(", ");
        return `
          <li class="rank-item">
            <div class="rank-item-main">
              <span class="rank-pos">${index + 1}º</span>
              <div>
                <strong>${escapeHtml(item.nome || "Sem nome")}</strong>
                <p>${escapeHtml(place)}</p>
              </div>
            </div>
            <div class="rank-item-actions">
              <button type="button" data-rank-action="up" data-id="${escapeAttr(
                id
              )}" aria-label="Subir" ${index === 0 ? "disabled" : ""}>↑</button>
              <button type="button" data-rank-action="down" data-id="${escapeAttr(
                id
              )}" aria-label="Descer" ${
                index === validOrder.length - 1 ? "disabled" : ""
              }>↓</button>
              <button type="button" class="rank-remove" data-rank-action="remove" data-id="${escapeAttr(
                id
              )}">Remover</button>
            </div>
          </li>
        `;
      })
      .join("");
  }

  function syncListingControls() {
    listings.forEach((item) => {
      const id = String(item.id);
      const el = document.querySelector(
        `[data-listing-controls="${cssEscape(id)}"]`
      );
      if (!el) return;

      const position = state.order.indexOf(id);
      if (position === -1) {
        el.innerHTML = `
          <button type="button" class="btn-rank" data-rank-action="add" data-id="${escapeAttr(
            id
          )}">Adicionar ao ranking</button>
        `;
        return;
      }

      el.innerHTML = `
        <span class="rank-badge">${position + 1}º no seu ranking</span>
        <button type="button" class="btn-rank btn-rank-ghost" data-rank-action="up" data-id="${escapeAttr(
          id
        )}" ${position === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="btn-rank btn-rank-ghost" data-rank-action="down" data-id="${escapeAttr(
          id
        )}" ${position === state.order.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="btn-rank btn-rank-ghost" data-rank-action="remove" data-id="${escapeAttr(
          id
        )}">Remover</button>
      `;
    });
  }

  function buildMessage() {
    const nome = (state.nome || rankNameInput?.value || "").trim() || "Sem nome";
    const lines = [
      `*Missão Praia — ranking de ${nome}*`,
      "",
    ];

    if (!state.order.length) {
      lines.push("_Ainda não rankeou nenhuma casa._");
      return lines.join("\n");
    }

    state.order.forEach((id, index) => {
      const item = byId.get(id);
      if (!item) return;
      const place = [item.local, item.cidade].filter(Boolean).join(", ");
      lines.push(`${index + 1}. ${item.nome}`);
      if (place) lines.push(`   ${place}`);
      if (item.link) lines.push(`   ${item.link}`);
      lines.push("");
    });

    lines.push("_Salvo no site Missão Praia_");
    return lines.join("\n").trim();
  }

  async function copyRankingMessage() {
    if (!state.order.length) {
      showFeedback("Adicione pelo menos uma casa ao ranking.");
      return;
    }

    if (!(state.nome || rankNameInput?.value || "").trim()) {
      showFeedback("Coloca seu nome antes de copiar.");
      rankNameInput?.focus();
      return;
    }

    const message = buildMessage();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        fallbackCopy(message);
      }
      showFeedback("Copiado! É só colar no WhatsApp do grupo.");
    } catch (error) {
      fallbackCopy(message);
      showFeedback("Copiado! É só colar no WhatsApp do grupo.");
    }
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  }

  function showFeedback(text) {
    if (!copyFeedback) return;
    copyFeedback.hidden = false;
    copyFeedback.textContent = text;
    window.clearTimeout(showFeedback._timer);
    showFeedback._timer = window.setTimeout(() => {
      copyFeedback.hidden = true;
    }, 3200);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { nome: "", order: [] };
      const parsed = JSON.parse(raw);
      return {
        nome: typeof parsed.nome === "string" ? parsed.nome : "",
        order: Array.isArray(parsed.order)
          ? parsed.order.map(String).filter(Boolean)
          : [],
      };
    } catch (error) {
      return { nome: "", order: [] };
    }
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        nome: state.nome || "",
        order: state.order,
      })
    );
  }

  function slugify(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function ratingLabel(key) {
    return (
      {
        limpeza: "Limpeza",
        comunicacao: "Comunicação",
        checkin: "Check-in",
        precisao: "Precisão",
        localizacao: "Localização",
        custoBeneficio: "Custo-benefício",
      }[key] || key
    );
  }

  function formatNum(value) {
    return Number(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }
})();
