(function () {
  const root = document.getElementById("listings");
  const empty = document.getElementById("empty");
  const cityNav = document.getElementById("city-nav");
  const listings = Array.isArray(window.LISTINGS) ? window.LISTINGS : [];

  const statusLabel = {
    avaliando: "Avaliando",
    favorita: "Favorita",
    descartada: "Descartada",
  };

  if (!listings.length) {
    empty.classList.remove("hidden");
    return;
  }

  const statusOrder = { favorita: 0, avaliando: 1, descartada: 2 };
  const byCity = new Map();

  listings.forEach((item) => {
    const city = item.cidade || "Outras";
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city).push(item);
  });

  const cities = [...byCity.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

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

  function renderListing(item, index) {
    const article = document.createElement("article");
    article.className = `listing listing--${item.status || "avaliando"}`;
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

        ${
          item.link
            ? `<a class="listing-link" href="${escapeAttr(
                item.link
              )}" target="_blank" rel="noopener noreferrer">Abrir no Airbnb</a>`
            : ""
        }
      </div>
    `;

    return article;
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
})();
