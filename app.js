        "sads-theme",
        dark ? "light" : "dark"
      );

      $("#themeBtn").textContent=
        dark ? "☾" : "☀";

    }
  );


if(
  localStorage.getItem(
    "sads-theme"
  )==="dark"
){

  document.documentElement
    .dataset.theme="dark";

  $("#themeBtn").textContent="☀";

}


/* اختصارات الكيبورد */

document.addEventListener(
  "keydown",
  e=>{

    if(
      (e.ctrlKey||e.metaKey) &&
      e.key.toLowerCase()==="k"
    ){

      e.preventDefault();
