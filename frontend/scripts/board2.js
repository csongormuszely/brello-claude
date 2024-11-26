// Double-check initialization after a slight delay
setTimeout(() => {
  console.log(
    "Delayed check - Lists container contents:",
    document.getElementById("listsContainer")?.innerHTML ||
      "No lists container found"
  );
}, 1000);
