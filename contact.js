(function () {
  const trigger = document.getElementById('mailTrigger');
  const panel = document.getElementById('contactFormPanel');
  if (!trigger || !panel) return;

  const label = trigger.querySelector('.mail-trigger-text');

  function toggle() {
    const isOpen = trigger.classList.toggle('is-open');
    panel.classList.toggle('is-open', isOpen);
    trigger.setAttribute('aria-expanded', String(isOpen));
    if (label) label.textContent = isOpen ? 'Close' : 'Send a message';

    if (isOpen) {
      const firstField = panel.querySelector('input[name="name"]');
      if (firstField) setTimeout(() => firstField.focus(), 300);
    }
  }

  let ready = document.readyState === 'complete';
  let pendingClick = false;

  if (!ready) {
    window.addEventListener(
      'load',
      () => {
        ready = true;
        if (pendingClick) {
          pendingClick = false;
          toggle();
        }
      },
      { once: true }
    );
  }

  trigger.addEventListener('click', () => {
    if (!ready) {
      pendingClick = true;
      return;
    }
    toggle();
  });
})();

(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = form.querySelector('.contact-form-status');
  const submitButton = form.querySelector('.contact-submit');
  const ENDPOINT = 'https://formsubmit.co/ajax/aaron.meys9@gmail.com';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    status.dataset.state = 'sending';
    status.textContent = 'Sending…';

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error('Request failed');
      status.dataset.state = 'sent';
      status.textContent = "Sent — I'll get back to you soon.";
      form.reset();
    } catch (err) {
      status.dataset.state = 'error';
      status.textContent = 'Something went wrong — email me directly instead.';
    } finally {
      submitButton.disabled = false;
    }
  });
})();
