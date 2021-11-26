function get_time(date1, date2) {
    var diff = (date1 - date2) / (1000 * 60 * 60 * 24); //In days var time;
    if (Math.abs(diff) > 1) {
        time = Math.floor(Math.abs(diff)).toString();
        if (diff > 0) {
            return (time + " days early");
        }
        else {
            return (time + " days late");
        }
    }
    diff *= 24; //In hours
    if (Math.abs(diff) > 1) {
        time = Math.floor(Math.abs(diff)).toString();
        if (diff > 0) {
            return (time + " hours early");
        }
        else {
            return (time + " hours late");
        }
    }
    diff *= 60; //In mins
    if (Math.abs(diff) > 1) {
        time = Math.floor(Math.abs(diff)).toString();
        if (diff > 0) {
            return (time + " minutes early");
        }
        else {
            return (time + " minutes late");
        }
    }
    diff *= 60; //In seconds
    time = Math.floor(Math.abs(diff)).toString();
    if (diff > 0) {
        return (time + " minutes early");
    }
    else {
        return (time + " minutes late");
    }
}