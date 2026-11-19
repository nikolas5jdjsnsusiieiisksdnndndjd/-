const form = document.getElementById("letterForm");
const message = document.getElementById("formMessage");
const button = form.querySelector("button");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.className = "form-message";
  message.textContent = "";
  button.disabled = true;
  button.querySelector("span").textContent = "Надсилаємо листа…";

  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Сталася помилка.");
    form.reset();
    message.textContent = "Твій лист успішно вирушив до пошти Святого Миколая! Дякуємо, що поділився своєю мрією. ✨";
    message.className = "form-message show success";
  } catch (error) {
    message.textContent = error.message || "Не вдалося надіслати лист. Спробуй ще раз.";
    message.className = "form-message show error";
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Відправити листа";
  }
});
