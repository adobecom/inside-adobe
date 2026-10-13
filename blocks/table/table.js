// A block authored as rows (first row = header) becomes a real table
function rowsToTable(el) {
  const table = document.createElement('table');
  [...el.children].forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement('td');
      td.append(...cell.childNodes);
      tr.append(td);
    });
    table.append(tr);
  });
  el.replaceChildren(table);
}

export default function init(el) {
  if (!el.querySelector('table')) rowsToTable(el);
  const tables = el.querySelectorAll('table');
  for (const table of tables) {
    let thead = table.querySelector('table > thead');
    const rows = [...table.querySelectorAll('tr')];

    if (!thead) {
      thead = document.createElement('thead');
      table.prepend(thead);

      const headingRow = rows.shift();
      if (headingRow) {
        thead.append(headingRow);
        const tds = headingRow.querySelectorAll(':scope > td');
        for (const td of tds) {
          const th = document.createElement('th');
          th.className = td.className;
          th.innerHTML = td.innerHTML;
          td.parentElement.replaceChild(th, td);
        }
      }
    }

    for (const row of rows) {
      row.classList.add('table-content-row');
    }
  }
}
