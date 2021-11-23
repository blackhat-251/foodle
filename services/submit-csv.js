function csv_creator(files_data) {
    var datacsv = "Assignment_Code,username,submitted_filename,feedback,grade(0-100)\n"
    for (const file_data of files_data) {
        datacsv += `${file_data.assigncode},${file_data.username},${file_data.filename},${file_data.feedback},${file_data.grade}\n`
    }
    return datacsv
}
module.exports = csv_creator;
