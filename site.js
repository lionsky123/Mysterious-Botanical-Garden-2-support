(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const languageKey = 'garden2-website-language';
  const repositoryUrl = 'https://github.com/lionsky123/Mysterious-Botanical-Garden-2-support';
  let language = 'zh';
  let category = 'all';
  const tr = (zh, en) => language === 'zh' ? zh : en;

  function filterQuestions() {
    if (!$('#faqSearch')) return;
    const query = $('#faqSearch').value.trim().toLocaleLowerCase();
    let count = 0;
    $$('.faq-item').forEach(item => {
      const visible = (category === 'all' || item.dataset.category === category) && (!query || item.dataset.search.toLocaleLowerCase().includes(query));
      item.hidden = !visible;
      if (visible) count++;
    });
    $('.empty-state').classList.toggle('is-visible', count === 0);
    $('#searchStatus').textContent = tr(`找到 ${count} 个问题`, `${count} questions found`);
  }
  function setLanguage(next) {
    language = next;
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    document.title = next === 'zh' ? `神秘植物园2 · ${document.body.dataset.page === 'privacy' ? '隐私政策' : '技术支持'}` : `Mysterious Botanical Garden 2 · ${document.body.dataset.page === 'privacy' ? 'Privacy Policy' : 'Support'}`;
    $$('[data-zh][data-en]').forEach(el => { el.textContent = el.dataset[next]; });
    $$('[data-placeholder-zh]').forEach(el => { el.placeholder = next === 'zh' ? el.dataset.placeholderZh : el.dataset.placeholderEn; });
    $('#languageLabel').textContent = tr('EN', '中文');
    $('#languageButton').setAttribute('aria-label', tr('Switch to English', '切换为中文'));
    $('.page-nav').setAttribute('aria-label',tr('页面导航','Page navigation'));
    $('.footer-inner>nav').setAttribute('aria-label',tr('页脚导航','Footer navigation'));
    if ($('.faq-filters')) $('.faq-filters').setAttribute('aria-label',tr('问题分类','Question categories'));
    $$('img[data-alt-zh]').forEach(img => { img.alt = next === 'zh' ? img.dataset.altZh : img.dataset.altEn; });
    if ($('#reportPreview') && !$('#reportPreview').hidden) $('#reportText').textContent = reportText();
    try { localStorage.setItem(languageKey, next); } catch (_) { /* Language storage is optional. */ }
    filterQuestions();
    updateActiveSection();
  }
  $('#languageButton').addEventListener('click', () => setLanguage(language === 'zh' ? 'en' : 'zh'));
  $('#faqSearch')?.addEventListener('input', filterQuestions);
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    $$('[data-filter]').forEach(other => {
      const selected = other === button;
      other.classList.toggle('active', selected);
      other.setAttribute('aria-pressed', String(selected));
    });
    filterQuestions();
  }));

  const dialog = $('#reportDialog');
  let lastFocus;
  function reportText() {
    const data = new FormData($('#reportForm'));
    return tr(
      `# ${String(data.get('title') || '').trim()}\n\n项目：神秘植物园2\n设备与系统：${String(data.get('device') || '').trim()}\n应用版本：${String(data.get('version') || '').trim() || '未填写'}\n\n## 当前站点、操作步骤与问题描述\n${String(data.get('description') || '').trim()}\n\n附图前，请遮盖现实环境中的人脸、地址与其他私人信息。`,
      `# ${String(data.get('title') || '').trim()}\n\nProject: Mysterious Botanical Garden 2\nDevice & system: ${String(data.get('device') || '').trim()}\nApp version: ${String(data.get('version') || '').trim() || 'Not specified'}\n\n## Current stop, steps, and description\n${String(data.get('description') || '').trim()}\n\nHide faces, addresses, and private details in screenshots of your surroundings.`
    );
  }
  function validateReport() {
    const form = $('#reportForm');
    if (!form.reportValidity()) return false;
    for (const name of ['title','device','description']) {
      const field = form.elements[name];
      if (!field.value.trim()) {
        field.setCustomValidity(tr('请填写有效内容。','Please enter a value.'));
        field.reportValidity();
        return false;
      }
    }
    return true;
  }
  function previewReport() {
    $('#reportText').textContent = reportText();
    $('#reportPreview').hidden = false;
    $('#reportPreview').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  function prepareIssueDraft() {
    const data = new FormData($('#reportForm'));
    const url = new URL(`${repositoryUrl}/issues/new`);
    url.searchParams.set('title', `[Support] ${String(data.get('title') || '').trim()}`);
    url.searchParams.set('body', reportText());
    const needsPaste = url.href.length > 7500;
    if (needsPaste) url.searchParams.delete('body');
    return {url: url.href, needsPaste};
  }
  if (dialog) {
    $('#openReport').addEventListener('click', () => {
      lastFocus = document.activeElement;
      $('#reportStatus').textContent = '';
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
    $('#closeReport').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastFocus?.focus({preventScroll:true}); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom) dialog.close();
    });
    $('#reportForm').addEventListener('input', event => {
      if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
      $('#reportStatus').textContent = '';
      if (!$('#reportPreview').hidden) $('#reportText').textContent = reportText();
    });
    $('#previewReport').addEventListener('click', () => { if (validateReport()) previewReport(); });
    $('#reportForm').addEventListener('submit', event => {
      event.preventDefault();
      if (!validateReport()) return;
      previewReport();
      const draft = prepareIssueDraft();
      window.open(draft.url, '_blank', 'noopener,noreferrer');
      const status = $('#reportStatus');
      status.replaceChildren(document.createTextNode(draft.needsPaste
        ? tr('报告内容较长，请复制完整报告，在 GitHub 中粘贴后确认提交。 ', 'This report is long. Copy the full report and paste it on GitHub before submitting. ')
        : tr('问题草稿已准备好，请在 GitHub 核对后确认提交。 ', 'Your draft is ready. Review and confirm submission on GitHub. ')));
      const link = document.createElement('a');
      link.href = draft.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = tr('打开 GitHub 问题草稿 →', 'Open the GitHub issue draft →');
      status.append(link);
    });
    $('#copyReport').addEventListener('click', async () => {
      if (!validateReport()) return;
      let copied = false;
      try { await navigator.clipboard.writeText(reportText()); copied = true; } catch (_) {
        const text = document.createElement('textarea');
        text.value = reportText();
        text.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
        dialog.append(text); text.select();
        try { copied = document.execCommand('copy'); } catch (_) { /* Provide selectable report below. */ }
        text.remove(); $('#copyReport').focus();
      }
      if (!copied) previewReport();
      $('#reportStatus').textContent = copied ? tr('问题信息已复制。','Report copied.') : tr('请选中下方草稿进行复制。','Select the draft below to copy it.');
    });
  }

  function updateActiveSection() {
    const sections = $$('.policy-section');
    if (!sections.length) return;
    const offset = $('.site-header').getBoundingClientRect().height + 50;
    let selected = sections[0].id;
    for (const section of sections) if (section.getBoundingClientRect().top <= offset) selected = section.id;
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 8) selected = sections[sections.length - 1].id;
    $$('.policy-toc a').forEach(link => {
      const active = link.getAttribute('href') === `#${selected}`;
      link.classList.toggle('active',active);
      if (active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');
    });
  }
  let pendingScroll = false;
  function onScroll() {
    if (pendingScroll) return;
    pendingScroll = true;
    requestAnimationFrame(()=>{pendingScroll=false;updateActiveSection();});
  }
  if ($('.policy-section')) {
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll,{passive:true});
    $('.mobile-toc').addEventListener('click',event=>{if(event.target.closest('a[href^="#"]')) $('.mobile-toc').open=false;});
  }
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && $('#faqSearch') && !dialog?.open && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
      event.preventDefault(); $('#faqSearch').focus(); $('#faqSearch').scrollIntoView({block:'center'});
    }
  });
  try { if (localStorage.getItem(languageKey) === 'en') language='en'; } catch (_) { /* Chinese is the default. */ }
  setLanguage(language);
})();
