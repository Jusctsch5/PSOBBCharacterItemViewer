// 入力データ
var fileData = [];
var itemCodeData = [];
var lang = "EN";
// デコード済みデータ
var charactors = [];
var shareBanks = [];
var allItems = [];
var currentpage;

// 初期表示
initializeLang();
initializeDisplay();

function initializeLang()
{
  if (localStorage.getItem("lang"))
  {
    this.lang = JSON.parse(localStorage.getItem("lang"));
    console.log("lang:" + this.lang);
  }
  if (this.lang == "JA") {
    document.getElementsByName("lang")[1].checked = true;
  }
}

// ローカルストレージが存在していた場合、画面に表示する
function initializeDisplay()
{
  try
  {
    if (localStorage.getItem("fileData"))
    {
      this.fileData = JSON.parse(localStorage.getItem("fileData"));
      console.log(JSON.parse(localStorage.getItem("fileData")));
      decoder();
    }
    displayPager();
    displayData();
  }
  catch (e)
  {
    alert("error occurred. please super reload (F5)");
    console.log(e);
    document.getElementById("data").innerHTML = '';
    document.getElementById("pager").innerHTML = '';
    removeCharactorData();
    localStorage.removeItem("fileData");
  }
}

function changeLang()
{
  (document.getElementsByName("lang")[1].checked)
    ? this.lang = "JA"
    : this.lang = "EN";

  localStorage.setItem("lang", JSON.stringify(this.lang));
  console.log(this.lang);

  // 入力リアルタイム検索機能ロード
  realtimeSearch();

  // 言語変更でDOMを変更
  if (localStorage.getItem("currentpage"))
  {
    let currentpage = JSON.parse(localStorage.getItem("currentpage"));
    console.log("currentpage:" + currentpage);

    let id = document.getElementById("data");
    id.innerHTML = '';

    if (currentpage === "itemcode") displayItemCodes();
    if (currentpage === "shareBanks") displayInventory(this.shareBanks[0].ShareBank[this.lang], "SHARE BANK");
    if (currentpage === "allItems")   displayInventory(this.allItems[this.lang], "ALL ITEMS", "allItems");
    if (!isNaN(currentpage)) displayCharactor(this.charactors[currentpage]);
  }
}


function clickDisplayItemCodes(event)
{
  localStorage.setItem("currentpage", JSON.stringify("itemcode"));
  displayItemCodes();
}

function decoder()
{
  if (this.fileData.length === 0) return;

  let fileData = this.fileData;
  let charactors = [];
  let shareBanks = [];
  let allItems = {
      "JA" : [],
      "EN" : []
    };

  for (let i in fileData)
  {
    let binary = Object.values(fileData[i]["binary"]);

    // 共有倉庫ファイルをデコード
    if (fileData[i]["filename"].match(/psobank/) !== null)
    {
      let shareBank = new ShareBank(binary, "Share Bank");
      shareBanks.push(shareBank);
      allItems["EN"] = allItems["EN"].concat(shareBank.ShareBank["EN"]);
      allItems["JA"] = allItems["JA"].concat(shareBank.ShareBank["JA"]);
      continue;
    }

    //　キャラクターファイルをデコード
    if (fileData[i]["filename"].match(/psochar/) !== null)
    {
      let slot = fileData[i]["filename"].match(/\s\d+/)[0].trim();
      let charactor = new Charactor(binary, Number(slot) + 1);
      charactors.push(charactor);

      allItems["EN"] = allItems["EN"].concat(charactor.Inventory["EN"]);
      allItems["EN"] = allItems["EN"].concat(charactor.Bank["EN"]);
      allItems["JA"] = allItems["JA"].concat(charactor.Inventory["JA"]);
      allItems["JA"] = allItems["JA"].concat(charactor.Bank["JA"]);
    }
  }

  // ソート
  allItems["EN"] = allItems["EN"].sort();
  allItems["JA"] = allItems["JA"].sort();

  console.log(allItems);
  // グローバル変数初期化
  removeCharactorData();
  // グローバル変数とローカルストレージにセット
  setCharactorData(charactors, shareBanks, allItems);
}

async function clickInput(event)
{
  try {
    let fileReader = new FileReader();
    let files = sortInputFiles(event.target.files);
    let fileData = [];

    for (let i = 0; i < files.length; i++)
    {
      //　キャラクターデータファイルだけ取り込み
      if (files[i].name.match(/psobank|psochar/) == null) continue;

      fileReader.readAsArrayBuffer(files[i]);
      await new Promise(resolve => fileReader.onload = () => resolve());
      let binary = new Uint8Array(fileReader.result);

      fileData.push({
        "filename": files[i].name,
        "binary": binary
      });
    }

    // なかったら終わり
    if (fileData.length === 0) return;

    localStorage.setItem("fileData", JSON.stringify(fileData));
    this.fileData = fileData;

    // デコード
    decoder();
    // ページャーを表示
    displayPager();
    // 詳細表示
    displayData();
    // 入力リアルタイム検索機能ロード
    realtimeSearch();

    // 現在ページの情報を保存
    localStorage.setItem("currentpage", JSON.stringify(0));
  } catch(e) {
    //例外エラーが起きた時に実行する処理
    console.log(e);
    if (e.name === 'QuotaExceededError')
    {
      alert("File size is too large. Try to Reduce input file number or Browser cokkie settings.\n"
          + "ファイルサイズが多すぎます。 入力するファイル数を減らすか、ブラウザのクッキー設定を行ってください。");
    } else {
      alert(e);
    }
  }
}

function setCharactorData(charactors, shareBanks, allItems)
{
  if (charactors.length !== 0)
  {
    this.charactors = charactors;
    console.log(charactors);
  }

  if (shareBanks.length !== 0)
  {
    this.shareBanks = shareBanks;
    console.log(shareBanks);
  }

  if (allItems.length !== 0)
  {
    this.allItems = allItems;
    console.log(allItems);
  }
}

function clickCharactor(name)
{
  // 現在ページの情報を保存
  localStorage.setItem("currentpage", JSON.stringify(name));
  displayCharactor(this.charactors[name]);
}

function clickShareBank(name)
{
  // 現在ページの情報を保存
  localStorage.setItem("currentpage", JSON.stringify("shareBanks"));
  let id = document.getElementById("data");
  id.innerHTML = '';
  displayInventory(this.shareBanks[name].ShareBank[this.lang], "SHARE BANK")
}

function clickAllItems(name)
{
  // 現在ページの情報を保存
  localStorage.setItem("currentpage", JSON.stringify("allItems"));
  let id = document.getElementById("data");
  id.innerHTML = '';
  displayInventory(this.allItems[this.lang], "ALL ITEMS", "allItems")
}

// FileListをファイル名の照準にする
function sortInputFiles(files)
{
  let sorted = [].slice.call(files).sort(function(a, b) {
    if (a.name.match(/psobank/)) return -1;

    // ファイル名のスロット番号を切り取って数値に変換する
    if (a.name.match(/\s\d+/) != null) {
      a = parseInt(a.name.match(/\s\d+/)[0].trim());
    }
    if (b.name.match(/\s\d+/) != null){
      b = parseInt(b.name.match(/\s\d+/)[0].trim());
    }

    if ( a > b ) {
      return 1;
    } else if ( a < b )
    {
      return -1;
    } else {
      return 0;
    }
  });
  return sorted;
}

function getInputItemCodes(list)
{
  let itemCodes = {};
  let ephinea  = true;
  let other = false;
  for (let i in list) {
    other = (list[i].match(/then.+(Vanilla|Ultima|Schthack)/) != null)

    if (other | !ephinea) {
      if ((list[i].match(/then.+(Ephinea)/) != null)){
        ephinea = true;
      } else {
        ephinea = false;
        continue;
      }
    }

    if (list[i].match(/(^.+|^)t\[ /) != null)
    {
      let name = list[i].match(/0x([0-9]|[A-Z]){6}/)[0];
      let value = list[i].match(/(?<=--( |\t)).*$/)[0];
      itemCodes[name.toString()] = value;
    }
  }
  return itemCodes;
}

function setItemCodes(itemCodeData)
{
  this.itemCodeData = itemCodeData;
  localStorage.setItem("itemCodeData", JSON.stringify(itemCodeData));
}

function getDate()
{
  let date = new Date();
  return date.toLocaleString();
}

function removeCharactorData()
{
  this.charactors = [];
  this.shareBanks = [];
  this.allItems = [];
}

// 検索ボタンイベント
function clickSearch(event)
{

  search(
    this.allItems,
    this.lang,
    document.getElementsByName("itemname")[0].value,
    document.getElementsByName("hit")[0].value,
    document.getElementsByName("unTekked")[0].checked);
}

// 入力イベントの随時検索
function realtimeSearch()
{
  let id = document.getElementById("search");
  let allitems = this.allItems;
  let lang = this.lang;
  // イベントリスナーでイベント「input」を登録
  id.addEventListener("input",function(){
    let itemname = document.getElementsByName("itemname")[0].value;
    let hit = document.getElementsByName("hit")[0].value;
    let unTekked = document.getElementsByName("unTekked")[0].checked;

    search(allItems, lang, itemname, hit, unTekked);
  });
}

function search(allItems, lang, itemname, hit, unTekked)
{
  console.log("==== search all items ====");
  console.log(allItems);
  console.log("search itemname:" + itemname);
  console.log("search hit:" + hit);
  console.log("search unTekked:" + unTekked);

  let id = document.getElementById("data");
  id.innerHTML = '';

  // リストがない場合は終了
  if (this.allItems.length === 0) return;

  // 検索結果初期値。検索欄未入力で全アイテムを表示する
  let result = allItems[lang];

  // 検索ワードの全角を半角に変換
  itemname = itemname.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  // 検索ワードを大文字に変換、ひらがなをカタカナに変換、トリム
  itemname = itemname.toUpperCase().trim().replace(/[ぁ-ん]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) + 0x60);
  });

  // 検索Hit値の全角を半角に変換
  hit = hit.replace(/[０-９]/g, function(s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });


  // 名前が指定された場合
  if (itemname !== "")
  {
    result = result.filter(function(x)
      {
        // 検索対象のアイテムを大文字に変換、ひらがなをカタカナに変換
        let tmp = x[1].name.toUpperCase().replace(/[ぁ-ん]/g, function(s) {
          return String.fromCharCode(s.charCodeAt(0) + 0x60);
        });

        return tmp.match(itemname);
      }
    );
  }

  if (unTekked === true)
  {
    result = result.filter(function(x)
      {
        if (x[1].type === "w") return x[1].tekked === false;
      }
    );
  }

  // HIT値
  if (hit !== "" & !isNaN(hit))
  {
    result = result.filter(function(x)
      {
        if (x[1].type === "w") return x[1].attribute["hit"] >= hit;
      }
    );
  }

  console.log("==== search results ====");
  console.log(result);
  displayInventory(result, "SEARCH RESULTS", "allItems")
}

// 初期表示でリアルタイム検索読み込み
window.addEventListener('load', function(){
  realtimeSearch();
});
