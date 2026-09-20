const {
    ChartJSNodeCanvas
} = require("chartjs-node-canvas");
const {
    AttachmentBuilder
} = require("discord.js");

const canvas = new ChartJSNodeCanvas({
    width: 800,
    height: 400,
    backgroundColour: "#2f3136"
});

async function generatePingChart(history) {
    const labels = history.map((e) => {
        const d = new Date(e.timestamp);
        return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    });

    const config = {
        type: "line",
        data: {
            labels,
            datasets: [{
                    label: "WS Ping",
                    data: history.map((e) => e.ws),
                    borderColor: "#5865f2",
                    backgroundColor: "#5865f21a",
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: "REST Ping",
                    data: history.map((e) => e.rest),
                    borderColor: "#57f287",
                    backgroundColor: "#57f2871a",
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: "DB Ping",
                    data: history.map((e) => e.db),
                    borderColor: "#fee75c",
                    backgroundColor: "#fee75c1a",
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: true,
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#dcddde",
                        font: {
                            size: 12
                        }
                    },
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: "#72767d",
                        maxTicksLimit: 10
                    },
                    grid: {
                        color: "#72767d33"
                    },
                },
                y: {
                    min: 0,
                    ticks: {
                        color: "#72767d",
                        callback: (v) => `${v}ms`
                    },
                    grid: {
                        color: "#72767d33"
                    },
                    beginAtZero: true,
                },
            },
        },
    };

    const buffer = await canvas.renderToBuffer(config);
    return new AttachmentBuilder(buffer, {
        name: "ping-chart.png"
    });
}

module.exports = {
    generatePingChart
};