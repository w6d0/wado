// 簡単な初期アニメーションとボタン挙動
window.addEventListener('DOMContentLoaded', ()=>{
  document.body.classList.add('loaded');

  // 注文ボタンでフッターへスクロール
  const btn = document.querySelector('.primary');
  const footer = document.querySelector('.site-footer');
  if(btn && footer){
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      footer.scrollIntoView({behavior:'smooth'});
    });
  }
});
