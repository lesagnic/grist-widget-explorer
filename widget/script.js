//
// Variables globales
//
let currentRowId = null;
//
// Gestion de la ligne du tableau sélectionnée
function HighlightSelectedRow(id) {
  currentRowId = id;
  document.querySelectorAll("div").forEach(el => {
    el.classList.toggle('selected', el.id==`_row_${currentRowId}`);
  });
}
//
// Création des items de l'explorateur (chaque item correspond à une ligne du tableau)
//
function ManageItem(table,element,filter) {
  let list = [];
  table.forEach ( record => {
    // On récupère les colonnes mappées
    const mapped = grist.mapColumnNames(record);
    let val = "(vide)";
    if (mapped) {
      if ( mapped.Item!="" ){
        val = mapped.Item;
      }
      if ( (filter==null || filter==mapped.Groups[mapped.Groups.length-1]) && !list.includes(val) ) {
        // HTML content corresponding to the new item value
        const li = document.createElement('li');
        const div = document.createElement('div');
        div.id = `_row_${record.id}`;
        div.className = 'exp-leaf exp-node';
        div.onclick = () => {
          grist.setSelectedRows([record.id])
          HighlightSelectedRow(record.id)
        };
        div.textContent = val;
        li.appendChild(div);
        element.appendChild(li);
        // Add the new value to the list
        list[list.length]=val;
      }
    }
  });  
}
//
// Création (récursive) des noeuds de regoupement des items (un niveau de noeud par colonne de regroupement
//
function ManageGroup(table,idx,length,element,filter) {
  let list = [];
  table.forEach ( record => {
    // On récupère les colonnes mappées
    const mapped = grist.mapColumnNames(record);
    let val = "(vide)";
    if (mapped) {
      if ( mapped.Groups[idx]!="" ){
        val = mapped.Groups[idx];
      }
      if ( (filter==null || filter==mapped.Groups[idx-1]) && !list.includes(val) ) {
        // HTML content corresponding to the new value
        const li = document.createElement('li');
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const ul = document.createElement('ul');
        if (idx==length-1) ul.className='exp-last-level'
        else ul.className='exp-mid-level';
        summary.className = 'exp-node';
        summary.textContent = val;
        details.setAttribute("open","");
        details.appendChild(summary);
        details.appendChild(ul);
        li.appendChild(details);
        element.appendChild(li);
        // Add the new value to the list
        list[list.length]=val;
        // Manage next group level for the new value
        if ( idx < length-1) ManageGroup(table,idx+1,length,ul,val);
        else ManageItem(table,ul,val);

      }
    }
  });
}
//
// Les fonctions de l'API Grist
//
grist.ready({
  requiredAccess: 'read table',
  columns: [
    {
      name: "Groups",
      title: "Colonnes de regroupement (optionnel) en mettant en premier la colonne de plus haut niveau",
      optional: true,
      description: "Choisissez les colonnes en commençant par le groupe de plus haut niveau", // Ne s'affiche pas si multiple
      allowMultiple: true // Permet l'attribution de plusieurs colonnes.
    },
    {
      name: "Item",
      title: "Colonne du tableau à présenter (valeur unique pour chaque ligne)",
      optional: false,
      type: "Text", // Quel type de colonne nous attendons.
      description: "Choisissez la colonne identifiant les éléments à lister", // Description du champ.
      allowMultiple: false // Permet l'attribution de plusieurs colonnes.
    }
  ],
  allowSelectBy: true           // Permet de choisir ce widget comme input d'un autre widget
});
grist.onRecords(table => {
  const main = document.getElementById('exp-main');
  if (!main) return; // Au cas où le DOM ne serait pas prêt
  //On vide l'explorateur
  main.textContent=""; 
  // On récupère les colonnes mappées
  const mapped = grist.mapColumnNames(table[0]);
  let curgroup = 0;
  if(!mapped) return;
  const child = document.createElement('ul');
  child.className = 'exp-1st-level';
  if ( mapped.Groups!=null && mapped.Groups.length > 0) ManageGroup(table,0,mapped.Groups.length,child,null);
  else {
    ManageItem(table,child,null);
  }
  main.appendChild(child);
  if ( currentRowId == null ) {
    // Je ne sais pas pourquoi, mais il faut le sélectionner la ligne 2 fois...
    // ... sinon la vue Indicateur sélectionné est vide si on appelle
    // la page dans un nouvel onglet.
    grist.setSelectedRows([table[0].id]);
    grist.setSelectedRows([table[0].id]);
    HighlightSelectedRow(table[0].id);
  }
});
grist.onRecord(record => {
  HighlightSelectedRow(record.id);
});