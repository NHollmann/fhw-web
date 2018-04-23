'use strict';

import { isDefined } from './helper';
const htmlEscape = require('html-escape');
const errorColor = '#b30000';

function wrapInBody(innerHtml = '') {
	return `<body style="background-color: ${errorColor};">\n${innerHtml}\n</body>`
}

function styleBody(top, tail) {
	return `${top} style="background-color: ${errorColor};" ${tail}`;
}

function renderError(html) {
	//return `<!--${htmlEscape(html)}-->`
	return `<!-- Error Description in hidden div below -->\n<div title="Error Description" style="display: none;">${html}</div>`
}

function generateErrorPage(error) {
	let html = error.html ? error.html : '';
	let extract = error.extract ? error.extract : '';
	extract = htmlEscape(extract.split('\n').map((line, index) => (index+1).toString() + '\t' + line).join('\n'));
	let stacktrace = error.stack ? error.stack : '';
	stacktrace = htmlEscape(stacktrace).split('\n').join('<br>');

	const regex = /(<body)([\s\S]*)/g;
	const match = regex.exec(html);
	if (match && isDefined(match[0]) && isDefined(match[1])) {
		html = styleBody(match[0], match[1]);
	} else {
		html = wrapInBody(html);
	}

	const description = renderError(`<h1>An ${error.name} occured:</h1>\n<p>${stacktrace}</p>\n<code>${extract}</code>\n`);

	return `${description}${html}`;
}

// based on https://stackoverflow.com/a/32749533
class ExtendableError extends Error {
	constructor(message, status = 500, html = '', extract = '') {
		super(message);
		this.name = this.constructor.name;
		this.status = status;
		this.html = html;
		this.extract = extract;

		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = (new Error(message)).stack;
		}
	}
}


class NotImplementedError extends ExtendableError {}
class RessourceNotFoundError extends ExtendableError {}
class FileNotFoundError extends ExtendableError {}
class FunctionNotFoundError extends ExtendableError {}
class HtmlValidationError extends ExtendableError {}
class CssValidationError extends ExtendableError {}
class RouteDefinitionError extends ExtendableError {}
class JsonParseError extends ExtendableError {}



module.exports = {
	// Für "übersehene Fehler" - also nicht behandelte bzw. nicht beachtete Fehlerfälle.
	generateErrorPage,
	NotImplementedError(message) { return new NotImplementedError(message, 500); },
	FileNotFoundError(message) { return new FileNotFoundError(message, 404); },
	FunctionNotFoundError(message) { return new FunctionNotFoundError(message, 500); },
	RessourceNotFoundError(message) { return new RessourceNotFoundError(message, 404); },
	HtmlValidationError(message, html, extract = html) { return new HtmlValidationError(message, 500, html, extract); },
	CssValidationError(message, html, extract) { return new CssValidationError(message, 500, html, extract); },
	RouteDefinitionError(message) { return new RouteDefinitionError(message, 500); },
	JsonParseError(message) { return new JsonParseError(message, 500); },
};

