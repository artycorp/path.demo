# Grafana Dashboard Emulation

A lightweight, front-end emulation of a Grafana dashboard, specifically designed to visualize performance metrics and slow requests (Loki-style).

## Features

- **Performance Visualization**: Includes histograms for request performance and stacked bar charts for performance by URLs.
- **Real-time Stats**: Displays key metrics like slow request count, total requests, and percentage of slow requests.
- **Dynamic Charts**: Powered by [Chart.js](https://www.chartjs.org/), featuring line charts for request rates and bar charts for request counts.
- **Detailed Data Table**: A sortable table showing detailed logs of slow requests, including response time, method, status, and URL.
- **Responsive Design**: Styled with CSS to mimic the Grafana dark theme and layout.

## Technologies Used

- **HTML5/CSS3**: For structure and styling.
- **JavaScript (ES6)**: For data simulation and UI logic.
- **Chart.js**: For rendering interactive charts.
- **Font Awesome**: For iconography.

## Getting Started

Simply open `index.html` in any modern web browser to view the dashboard.

```bash
# Clone the repository
git clone <repository-url>

# Open index.html
open index.html
```

