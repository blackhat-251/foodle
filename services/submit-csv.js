function csv_creator(files_data) {
    var datacsv = "Assignment_Code,username,submitted_filename,feedback\n"
    for (const file_data of files_data) {
        datacsv += `${file_data.assigncode},${file_data.username},${file_data.filename},${file_data.feedback}\n`
    }
    return datacsv
}
module.exports = csv_creator;
