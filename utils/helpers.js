export function formatDate(date) {
	return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}
