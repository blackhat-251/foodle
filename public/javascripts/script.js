function readSingleFile(e) {
  const name = e[0].name;
  var ext = /^.+\.([^.]+)$/.exec(name)[1];
  console.log(ext);
  const fi = e[0];
  const fsize = fi.size;
  const file_size = Math.round(fsize / 1024);
  if (file_size >= 4096) {
    alert("File too Big, please select a file less than 4mb");
  } else {
    document.getElementById("file-label").textContent = name;
    document.getElementById("submit-button").disabled = false;
  }
}
