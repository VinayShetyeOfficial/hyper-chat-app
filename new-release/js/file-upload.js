document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("file-upload");
  const uploadText = document.querySelector(".upload-text");
  const fileUploadLabel = document.querySelector(".custom-file-upload");

  if (fileInput && uploadText) {
    fileInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        // Show spinner and hide upload icon
        fileUploadLabel.classList.add("uploading");

        // Set text to "Uploading..."
        uploadText.textContent = "Uploading...";

        // Generate random time between 2-4 seconds
        const randomTime = Math.floor(Math.random() * 2000) + 2000;

        // Simulate upload delay
        setTimeout(function () {
          // Hide spinner and show success
          fileUploadLabel.classList.remove("uploading");
          fileUploadLabel.classList.add("file-selected-parent");

          // Show filename
          uploadText.textContent = fileInput.files[0].name;
          uploadText.classList.add("file-selected");
        }, randomTime);
      } else {
        uploadText.textContent = "Choose a profile picture";
        uploadText.classList.remove("file-selected");
        fileUploadLabel.classList.remove("file-selected-parent");
      }
    });
  }
});
