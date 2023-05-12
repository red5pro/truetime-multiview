const modal = document.getElementById("error-modal");

export const showError = (title, message, fatal = false) => {
	const titleElement = modal.querySelector(".error-modal_title");
	const messageElement = modal.querySelector(".error-modal_message");
	const closeElement = modal.querySelector(".error-modal_close");
	titleElement.textContent = title;
	messageElement.textContent = message;
	if (fatal && closeElement) {
		closeElement.classList.add("hidden");
	} else if (closeElement) {
		closeElement.addEventListener("click", () => {
			closeError();
		});
	}
	modal.showModal();
};

export const closeError = () => {
	const closeElement = modal.querySelector(".error-modal_close");
	if (closeElement) {
		closeElement.removeEventListener("click", () => {
			closeError();
		});
	}
	modal.close();
};
