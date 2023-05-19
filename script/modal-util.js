const errorModal = document.getElementById("error-modal");
const warningModal = document.getElementById("warning-modal");

export const showError = (title, message, fatal = false) => {
	const titleElement = errorModal.querySelector(".error-modal_title");
	const messageElement = errorModal.querySelector(".error-modal_message");
	const closeElement = errorModal.querySelector(".error-modal_close");
	titleElement.textContent = title;
	messageElement.textContent = message;
	if (fatal && closeElement) {
		closeElement.classList.add("hidden");
	} else if (closeElement) {
		closeElement.addEventListener("click", closeError);
	}
	errorModal.showModal();
};

export const closeError = () => {
	const closeElement = errorModal.querySelector(".error-modal_close");
	if (closeElement) {
		closeElement.removeEventListener("click", closeError);
	}
	errorModal.close();
};

export const showWarning = (title, message) => {
	const titleElement = warningModal.querySelector(".warning-modal_title");
	const messageElement = warningModal.querySelector(".warning-modal_message");
	const closeElement = warningModal.querySelector(".warning-modal_close");
	titleElement.textContent = title;
	messageElement.textContent = message;
	closeElement.addEventListener("click", closeWarning);
	warningModal.showModal();
};

export const closeWarning = () => {
	const closeElement = warningModal.querySelector(".warning-modal_close");
	if (closeElement) {
		closeElement.removeEventListener("click", closeWarning);
	}
	warningModal.close();
};
