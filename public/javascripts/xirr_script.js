
document.addEventListener('DOMContentLoaded', loadData);

async function loadData() {
    const statValues = document.getElementsByClassName('stat-value');
    const tbody = document.getElementsByClassName('addele')[0];

    try {
        console.log('Loading mutual fund portfolio...');

        // 1. Fetch the user's mutual funds
        const response = await fetch('/api/mutual-funds');

        if (!response.ok) {
            throw new Error(
                `Mutual funds API failed: HTTP ${response.status}`
            );
        }

        const allmutuals = await response.json();

        console.log('Mutual funds response:', allmutuals);

        if (!Array.isArray(allmutuals)) {
            throw new Error(
                'Expected /api/mutual-funds to return an array. Check the backend response.'
            );
        }

        // 2. Prepare the portfolio
        const mutualDetails = allmutuals.map(fund => ({
            name: fund.fundName || 'Unknown Fund',
            fundCode: fund.fundCode,
            amcName: 'Loading...',
            buyingDates: Array.isArray(fund.buyingDates)
                ? fund.buyingDates
                : [],
            investedAmount: Array.isArray(fund.investedAmount)
                ? fund.investedAmount
                : [],
            boughtUnits: Array.isArray(fund.boughtUnits)
                ? fund.boughtUnits
                : [],
            xirr: null,
            latestNav: 0,
            latestDate: '',
            totalUnits: 0,
            totalAmount: 0
        }));

        // Calculate investment totals even if NAV requests fail
        for (const fund of mutualDetails) {
            fund.totalUnits = fund.boughtUnits.reduce(
                (sum, units) => sum + (Number(units) || 0),
                0
            );

            fund.totalAmount = fund.investedAmount.reduce(
                (sum, amount) => sum + (Number(amount) || 0),
                0
            );
        }

        const alltotal = mutualDetails.reduce(
            (sum, fund) => sum + fund.totalAmount,
            0
        );

        const allUnits = mutualDetails.reduce(
            (sum, fund) => sum + fund.totalUnits,
            0
        );

        // 3. Update summary cards immediately
        if (statValues[0]) {
            statValues[0].textContent =
                '₹' + alltotal.toLocaleString('en-IN', {
                    maximumFractionDigits: 2
                });
        }

        if (statValues[1]) {
            statValues[1].textContent = allUnits.toFixed(2);
        }

        if (statValues[3]) {
            statValues[3].textContent = mutualDetails.length;
        }

        // 4. Render rows before making external-data requests
        if (!tbody) {
            throw new Error(
                'Table body with class "addele" was not found.'
            );
        }

        tbody.innerHTML = '';

        if (mutualDetails.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');

            cell.colSpan = 5;
            cell.textContent =
                'No mutual funds found. Add a fund to see your portfolio.';
            cell.style.textAlign = 'center';
            cell.style.padding = '24px';

            row.appendChild(cell);
            tbody.appendChild(row);

            if (statValues[2]) {
                statValues[2].textContent = 'N/A';
            }

            console.log('No mutual funds returned by the API.');
            return;
        }

        // 5. Fetch NAV through your Express backend
        // A NAV failure will not prevent the table from displaying.
        await Promise.all(
            mutualDetails.map(async fund => {
                if (!fund.fundCode) {
                    fund.amcName = 'Unavailable';
                    console.error(
                        'Missing fund code for:',
                        fund.name
                    );
                    return;
                }

                try {
                    const navResponse = await fetch(
                        `/api/mf-schemes/${encodeURIComponent(fund.fundCode)}`
                    );

                    if (!navResponse.ok) {
                        throw new Error(
                            `NAV API failed: HTTP ${navResponse.status}`
                        );
                    }

                    const rec = await navResponse.json();

                    if (
                        !rec.meta ||
                        !Array.isArray(rec.data) ||
                        rec.data.length === 0
                    ) {
                        throw new Error('Invalid NAV response');
                    }

                    fund.amcName =
                        rec.meta.fund_house || 'Unknown AMC';

                    fund.latestNav =
                        Number(rec.data[0].nav) || 0;

                    fund.latestDate =
                        rec.data[0].date || '';

                } catch (error) {
                    fund.amcName = 'Unavailable';

                    console.error(
                        `NAV fetch failed for ${fund.name}:`,
                        error
                    );
                }
            })
        );

        // 6. Request XIRR calculations
        let xirrValues = mutualDetails.map(() => null);

        try {
            const xirrResponse = await fetch('/calculateXirr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mutualDetails)
            });

            if (!xirrResponse.ok) {
                throw new Error(
                    `XIRR API failed: HTTP ${xirrResponse.status}`
                );
            }

            const result = await xirrResponse.json();

            console.log('XIRR response:', result);

            if (Array.isArray(result)) {
                xirrValues = result;
            } else {
                console.error(
                    'Expected an array from /calculateXirr.'
                );
            }

        } catch (error) {
            console.error('XIRR calculation failed:', error);
        }

        // 7. Render the portfolio table safely
        tbody.innerHTML = '';

        let totalXirr = 0;
        let validXirrCount = 0;

        mutualDetails.forEach((fund, index) => {
            const rawXirr = xirrValues[index];

            const xirr =
                rawXirr !== null &&
                rawXirr !== undefined &&
                rawXirr !== '' &&
                Number.isFinite(Number(rawXirr))
                    ? Number(rawXirr)
                    : null;

            const xirrPercent =
                xirr === null ? null : xirr * 100;

            let returnClass = 'neutral-return';

            if (xirrPercent !== null) {
                if (xirrPercent < 0) {
                    returnClass = 'negative-return';
                } else if (xirrPercent > 10) {
                    returnClass = 'positive-return';
                }

                totalXirr += xirrPercent;
                validXirrCount++;
            }

            const row = document.createElement('tr');

            // Fund name and icon
            const nameCell = document.createElement('td');

            const fundCell = document.createElement('div');
            fundCell.className = 'fund-cell';

            const icon = document.createElement('div');
            icon.className = 'fund-icon';
            icon.textContent = fund.name
                .slice(0, 2)
                .toUpperCase();

            const details = document.createElement('div');
            details.className = 'fund-details';

            const name = document.createElement('div');
            name.className = 'fund-name';
            name.textContent = fund.name.slice(0, 15);

            details.appendChild(name);
            fundCell.append(icon, details);
            nameCell.appendChild(fundCell);
            row.appendChild(nameCell);

            // AMC
            const amcCell = document.createElement('td');
            amcCell.className = 'amc-name';
            amcCell.textContent = fund.amcName;
            row.appendChild(amcCell);

            // Total invested
            const investedCell = document.createElement('td');
            investedCell.className = 'invested-amount';
            investedCell.textContent =
                '₹' + fund.totalAmount.toLocaleString('en-IN', {
                    maximumFractionDigits: 2
                });
            row.appendChild(investedCell);

            // Units
            const unitsCell = document.createElement('td');
            unitsCell.className = 'units';
            unitsCell.textContent = fund.totalUnits.toFixed(2);
            row.appendChild(unitsCell);

            // XIRR
            const xirrCell = document.createElement('td');

            const xirrSpan = document.createElement('span');
            xirrSpan.className = returnClass;
            xirrSpan.textContent =
                xirrPercent === null
                    ? 'N/A'
                    : `${xirrPercent.toFixed(2)}%`;

            xirrCell.appendChild(xirrSpan);
            row.appendChild(xirrCell);

            tbody.appendChild(row);
        });

        // 8. Calculate average XIRR
        if (statValues[2]) {
            statValues[2].textContent =
                validXirrCount > 0
                    ? `${(totalXirr / validXirrCount).toFixed(1)}%`
                    : 'N/A';
        }

        console.log('Portfolio rendering completed.');

    } catch (error) {
        console.error('Error loading mutual fund portfolio:', error);

        // Show a visible error instead of leaving a blank table
        if (tbody) {
            tbody.innerHTML = '';

            const row = document.createElement('tr');
            const cell = document.createElement('td');

            cell.colSpan = 5;
            cell.textContent =
                'Unable to load portfolio. Open the browser console for details.';
            cell.style.textAlign = 'center';
            cell.style.padding = '24px';

            row.appendChild(cell);
            tbody.appendChild(row);
        }
    }
}
