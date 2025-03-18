import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let dataset = []; // Store the full dataset globally

async function loadDataset() {
  dataset = await d3.csv('dataset.csv', d => ({
    id: d.id,
    decimallongitude: +d.decimallongitude,  // Convert to number
    decimallatitude: +d.decimallatitude,    // Convert to number
    date_year: +d.date_year,                // Convert to number
    depth: +d.depth,                        // Convert to number
    sst: +d.sst                             // Convert to number
  }));

  populateYearSelector();
  drawMap();
}

function populateYearSelector() {
  const yearSelector = d3.select("#yearSelector");

  // Get unique years from dataset
  const years = [...new Set(dataset.map(d => d.date_year))].sort((a, b) => a - b);

  // Add year options to dropdown
  yearSelector.selectAll("option")
    .data(years)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  // Set the default selected year
  yearSelector.property("value", '1950');

  // Attach event listener for year change
  // yearSelector.on("change", drawMap);
  d3.select("#yearSelector").on("input", drawMap);
}

async function drawMap() {
  const width = 500;
  const height = width;
  const svg = d3.select('#WorldSVG')
    .attr("viewBox", `0 0 ${width} ${height}`);

  try {
    // Load GeoJSON for world map
    const geojson = await d3.json('world.json');

    // Get the selected year
    const selectedYear = +d3.select("#yearSelector").property("value");

    // Filter dataset based on selected year
    const filteredData = dataset.filter(d => d.date_year === selectedYear);

    // Update observation count display
    d3.select("#observationCount").text(`${selectedYear} Observations: ${filteredData.length}`);

    // Define projection (Natural Earth projection)
    const projection = d3.geoNaturalEarth1()
      .fitExtent([[0, 0], [width, height]], geojson);

    // Define geoPath generator
    const geoGenerator = d3.geoPath().projection(projection);

    // Clear existing map content
    svg.selectAll("*").remove();

    // Draw graticule (latitude/longitude grid)
    const graticule = d3.geoGraticule();
    svg
      .append("g")
      .attr("stroke", "#666")
      .attr("stroke-width", "0.2")
      .attr("fill", "none")
      .append("path")
      .attr('d', geoGenerator(graticule()));

    // Draw landmasses
    svg
      .append("g")
      .attr("fill", "rgba(0, 198, 134, 0.6)")
      .selectAll('path')
      .data(geojson.features)
      .join('path')
      .attr('d', d => geoGenerator(d));

    // Plot points using "lionfish-red.svg"
    svg
      .append("g")
      .selectAll("image")
      .data(filteredData)
      .join("image")
      .attr("x", d => projection([d.decimallongitude, d.decimallatitude])[0] - 10)
      .attr("y", d => projection([d.decimallongitude, d.decimallatitude])[1] - 10)
      .attr("width", 20)
      .attr("height", 20)
      .attr("href", "lionfish-red.svg")
      .attr("opacity", 0.9);

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "25px")
      .attr("font-weight", "bold")
      .text(`Lionfish Observations 1950-2025`);
  } catch (error) {
    document.querySelector("#errorMessage").textContent = error;
  }
}


// Load dataset and initialize everything
loadDataset();

let intervalId = setInterval(() => {
  let currentValue = parseInt(d3.select("#yearSelector").property("value"));
  d3.select("#yearSelector").property("value", currentValue + 1);
  // you can also call your drawMap function here to update the visualization
  drawMap();
}, 3000);

let isPlaying = true;

d3.select("#play-pause-button").on("click", () => {
  if (isPlaying) {
    clearInterval(intervalId);
    isPlaying = false;
    d3.select("#play-pause-button").text("Play");
  } else {
    intervalId = setInterval(() => {
      let currentValue = parseInt(d3.select("#yearSelector").property("value"));
      d3.select("#yearSelector").property("value", currentValue + 1);
      drawMap();
    }, 5000);
    isPlaying = true;
    d3.select("#play-pause-button").text("Pause");
  }
});