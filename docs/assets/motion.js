(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let frame;
  function updateScroll() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const range = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${range > 0 ? scrollY / range * 100 : 0}%`;
      document.querySelector('.header').classList.toggle('scrolled', scrollY > 20);
    });
  }
  addEventListener('scroll', updateScroll, { passive: true });
  addEventListener('resize', updateScroll);
  updateScroll();
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.section-head,.service-card,.training-section,.portfolio-grid article,.instructor,.process,.contact').forEach(element => {
      element.classList.add('reveal-ready');
      observer.observe(element);
    });
    reduced.addEventListener('change', () => {
      if (reduced.matches) document.querySelectorAll('.reveal-ready').forEach(el => el.classList.add('is-visible'));
    });
  }
  function animateCards() {
    if (reduced.matches) return;
    document.querySelectorAll('.course').forEach((card, index) => {
      card.style.setProperty('--delay', `${Math.min(index, 5) * 35}ms`);
      card.classList.add('entering');
    });
  }
  document.addEventListener('catalog:render', animateCards);
  animateCards();
})();
