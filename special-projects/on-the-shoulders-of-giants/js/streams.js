
// Click event handler for the button
// $(document).ready(function() {
//     $.getJSON("https://opensheet.elk.sh/1wys3Ep3C1aemJU55aNxlwpAwkcvbCjYKGIzWocSsJ30/Streams", function (data) {

//         // console.log(data);
        
//         // Function to get a random link from the array
//         function getRandomData() {
//             var randomIndex = Math.floor(Math.random() * data.length);
//             return data[randomIndex];
//         }
        
//         // Function to display a random link
//         function displayRandomLink() {
//             var randomData = getRandomData();
//             var title = randomData.title;
//             var url = randomData.link;
//             var author = randomData.author;
//             var nugget = randomData.nugget ? randomData.nugget : '';
//             console.log(randomData);
//             console.log(url);
//             // Display the random link in the "result" div
//             $("#stream").html('<iframe width="100%" height="100%" src="' + url + '" title="' + title + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>');
//             $("#details").html('<div class="details"><h2>'+ title + '</h2><h3>by ' + author + '</h3><p>' + nugget + '</p></div>');
//         }

//         // Click event handler for the button
//         $("#randomButton").click(function() {
//             displayRandomLink();
//         });

//         displayRandomLink();
//     });
// });

// Function to play sound when button is clicked
function sound(){
    var snd = new Audio('media/click.mp3'); //wav is also supported
    snd.play(); //plays the sound
}


// Function to get YouTube links from an API endpoint or JSON file
function getvideoLinks(callback) {
    // Replace 'your-api-endpoint' with the actual endpoint or JSON file URL
    $.getJSON("https://opensheet.elk.sh/1wys3Ep3C1aemJU55aNxlwpAwkcvbCjYKGIzWocSsJ30/Streams", function (data) {
        // Assuming the data is an array of YouTube links, update videoLinks
        callback(data);
    });
}

var videoLinks = []; // Initialize the array

var currentIndex = Math.floor(Math.random() * videoLinks.length); // Initialize current index to -1 (no link displayed yet)

// Function to get a random link from the array
function getRandomIndex() {
    var randomIndex = Math.floor(Math.random() * videoLinks.length);
    return randomIndex;
}

// Function to display a link at a specific index
function displayLinkAtIndex(index) {
    console.log(videoLinks[index]);
    console.log(url);
    var url = videoLinks[index].link;
    var title = videoLinks[index].title;
    var author = videoLinks[index].author;
    var nugget = videoLinks[index].nugget ? videoLinks[index].nugget : '';
    
    // Display the random link in the "result" div
    $("#stream").html('<iframe width="100%" height="100%" src="' + url + '" title="' + title + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>');
    $("#details").html('<div class="details"><h2>'+ title + '</h2><h3>by ' + author + '</h3><p>' + nugget + '</p></div>');
}

// Function to display the next link
function displayPrevLink() {
    currentIndex = (currentIndex - 1 + videoLinks.length) % videoLinks.length; // Decrement index and loop back if needed
    console.log(currentIndex);
    displayLinkAtIndex(currentIndex);
}

// Function to display the next link
function displayNextLink() {
    currentIndex = (currentIndex + 1) % videoLinks.length; // Increment index and loop back if needed
    console.log(currentIndex);
    displayLinkAtIndex(currentIndex);
}

// Function to display a random link
function displayRandomLink() {
    currentIndex = getRandomIndex(); // Increment index and loop back if needed
    console.log(currentIndex);
    displayLinkAtIndex(currentIndex);
}

// Fetch YouTube links and display a random link at the start
$(document).ready(function() {
    getvideoLinks(function(data) {
        videoLinks = data;
        displayRandomLink();
    });
});

// Click event handler for the "Show Random YouTube Link" button
$(document).on("click", "#randomButton", function() {
    displayRandomLink();
});

// Click event handler for the "Next Link" button
$(document).on("click", "#nextButton", function() {
    displayNextLink();
});

// Click event handler for the "Next Link" button
$(document).on("click", "#prevButton", function() {
    displayPrevLink();
});