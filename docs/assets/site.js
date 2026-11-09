(function () {
  var KEY = "india-note:v1";

  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    return s && s.read ? s : { read: {}, scores: {}, wrong: {} };
  }
  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // items: [{slug, index, q, choices, answer, why}]
  function runQuiz(root, items, onDone) {
    var pos = 0, score = 0;

    function show() {
      root.textContent = "";
      var item = items[pos];
      root.appendChild(el("p", "quiz-count", "第" + (pos + 1) + "問 / 全" + items.length + "問"));
      root.appendChild(el("p", "quiz-q", item.q));
      var box = el("div", "choices");
      root.appendChild(box);
      item.choices.forEach(function (c, i) {
        var b = el("button", "choice", c);
        b.type = "button";
        b.onclick = function () { answer(item, i, box); };
        box.appendChild(b);
      });
    }

    function answer(item, picked, box) {
      var ok = picked === item.answer;
      if (ok) score++;
      Array.prototype.forEach.call(box.children, function (b, i) {
        b.disabled = true;
        if (i === item.answer) b.classList.add("right");
        else if (i === picked) b.classList.add("wrong");
      });
      var s = load(), id = item.slug + ":" + item.index;
      if (ok) delete s.wrong[id]; else s.wrong[id] = 1;
      save(s);
      root.appendChild(el("p", "quiz-result " + (ok ? "ok" : "ng"), ok ? "正解" : "不正解"));
      root.appendChild(el("p", "quiz-why", item.why));
      var next = el("button", "primary", pos + 1 < items.length ? "次の問題へ" : "結果を見る");
      next.type = "button";
      next.onclick = function () {
        pos++;
        if (pos < items.length) show(); else finish();
      };
      root.appendChild(next);
      next.focus();
    }

    function finish() {
      root.textContent = "";
      root.appendChild(el("p", "quiz-score", items.length + "問中 " + score + "問 正解"));
      if (onDone) onDone(score, items.length);
      var again = el("button", "", "もう一度解く");
      again.type = "button";
      again.onclick = function () { pos = 0; score = 0; show(); };
      root.appendChild(again);
    }

    show();
  }

  function itemsOf(slug) {
    return window.QUIZZES[slug].items.map(function (it, i) {
      return Object.assign({ slug: slug, index: i }, it);
    });
  }

  var quiz = document.getElementById("quiz");
  if (quiz) {
    var slug = quiz.dataset.slug;
    runQuiz(quiz, itemsOf(slug), function (score, total) {
      var s = load();
      s.read[slug] = 1;
      s.scores[slug] = { score: score, total: total };
      save(s);
    });
  }

  var review = document.getElementById("review");
  if (review) {
    var wrong = Object.keys(load().wrong).map(function (id) {
      var p = id.split(":"), q = window.QUIZZES[p[0]];
      return q && q.items[+p[1]] ? Object.assign({ slug: p[0], index: +p[1] }, q.items[+p[1]]) : null;
    }).filter(Boolean);
    if (wrong.length) runQuiz(review, wrong);
    else review.appendChild(el("p", "", "復習する問題はありません。"));
  }

  var state = load();
  document.querySelectorAll(".item[data-slug]").forEach(function (li) {
    var slug = li.dataset.slug, mark = li.querySelector(".state"), sc = state.scores[slug];
    if (state.read[slug]) mark.textContent = sc ? "読了 " + sc.score + "/" + sc.total : "読了";
  });

  var progress = document.querySelector(".progress");
  if (progress) {
    var ready = window.READY, done = ready.filter(function (s) { return state.read[s]; }).length;
    if (done) {
      progress.hidden = false;
      progress.querySelector(".bar span").style.width = (done / ready.length * 100) + "%";
      progress.querySelector("p").textContent = "公開中の" + ready.length + "記事のうち " + done + "記事を読了";
    }
  }

  var filter = document.getElementById("filter");
  if (filter) {
    filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase(), hits = 0;
      document.querySelectorAll("#all .cat").forEach(function (cat) {
        var any = false;
        cat.querySelectorAll(".item").forEach(function (li) {
          var m = li.dataset.search.toLowerCase().indexOf(q) >= 0;
          li.hidden = !m;
          if (m) { any = true; hits++; }
        });
        cat.hidden = !any;
      });
      document.getElementById("no-hit").hidden = hits > 0;
    });
  }

  var reset = document.getElementById("reset");
  if (reset) {
    reset.onclick = function () {
      if (!confirm("この端末の学習記録を消去しますか？")) return;
      try { localStorage.removeItem(KEY); } catch (e) {}
      reset.textContent = "消去しました";
      reset.disabled = true;
    };
  }
})();
