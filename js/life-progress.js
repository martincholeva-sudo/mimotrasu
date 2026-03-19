document.addEventListener("DOMContentLoaded", () => {
  const birthDate = new Date("1980-03-03"),
        deathDate = new Date("2070-03-03"),
        today = new Date();

  const totalLifeDays = Math.floor((deathDate - birthDate) / 86400000),
        elapsedLifeDays = Math.floor((today - birthDate) / 86400000),
        percentage = ((elapsedLifeDays / totalLifeDays) * 100).toFixed(2);

  const years = today.getFullYear() - birthDate.getFullYear(),
        hadBirthday = (today.getMonth() > birthDate.getMonth()) ||
                      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate()),
        adjustedYears = hadBirthday ? years : years - 1;

  let lastBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (!hadBirthday) lastBirthday.setFullYear(today.getFullYear() - 1);

  const daysSinceBirthday = Math.floor((today - lastBirthday) / 86400000);

  const percEl   = document.getElementById("life-percentage");
  const elapsedEl = document.getElementById("life-elapsed");
  const barEl    = document.getElementById("progress-bar");

  if (percEl)   percEl.textContent = percentage + " %";
  if (elapsedEl) elapsedEl.textContent = `Od narození: ${adjustedYears} let a ${daysSinceBirthday} dní`;
  if (barEl)    barEl.style.width = percentage + "%";
});
