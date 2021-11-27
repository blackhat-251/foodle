function csv_creator(files_data, deadline) {
  var datacsv =
    "Assignment_Code,username,submitted_filename,feedback,grade(0-100),Submission_delay\n";
  for (const file_data of files_data) {
    var late= ""
    //console.log(files_data.)
    if(deadline-file_data.createdAt<0)
      late="LATE"
    else
      late="early" 
    datacsv += `${file_data.assigncode},${file_data.username},${file_data.filename},${file_data.feedback},${file_data.grade ? file_data.grade : ""},${late}\n`;
  }
  return datacsv;
}
module.exports = csv_creator;
