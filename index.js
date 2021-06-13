(async function () {

    class MediaRange {
        constructor() {
            this.type = "";
            this.subtype = "";
            this.weight = {};
            this.parameter = {};
            this['accept-ext'] = {};
        }
    }

    class HTTPParser {
        constructor(options) {

            this.parseMediaRange = this.parseMediaRange.bind(this);
        }

        async parseMediaRange(header) {

            let mediaRange = new MediaRange();
            let part = "";
            let token = "";
            let quoted = false;
            let escaped = false;
            let context = "type";

            let index = 0; while (true) {

                let char = header[index];

                if (typeof char == "undefined") {

                    if (context == "parameter" && token && part) {

                        mediaRange[context][token] = part;
                    }
                    else if (context == "accept-ext" && part) {
                        if (token) {
                            mediaRange[context][token] = part;
                        }
                        else {
                            mediaRange[context][part] = "";
                        }
                    }
                    else if (context == "subtype" && part) {

                        mediaRange[context] = part;
                    }
                    else {
                        throw new Error();
                    }

                    return [mediaRange];
                }

                if (char == ";") {

                    if (quoted) {
                        part = part + char;
                    }
                    else if (context == "subtype" && part) {
                        mediaRange[context] = part;
                        context = "parameter"
                        part = "";
                        token = "";
                    }
                    else if (context == "parameter" && token && part) {
                        if (token == "q" && !mediaRange.weight.q) {
                            mediaRange["weight"]["q"] = part;
                            context = "accept-ext";
                        }
                        else {
                            mediaRange[context][token] = part;
                        }

                        token = "";
                        part = "";
                    }
                    else if (context == "accept-ext" && token) {
                        mediaRange[context][token] = part;
                        token = "";
                        part = ""
                    }
                    else if (context == "accept-ext" && !token) {
                        mediaRange[context][part] = "";
                        token = "";
                        part = ""
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == "=") {

                    if (quoted) {
                        part = part + char;
                    }
                    else if (context == "parameter" && part) {
                        token = part;
                        part = "";
                    }
                    else if (context == "accept-ext" && part) {
                        token = part;
                        part = "";
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == "/") {

                    if (quoted) {
                        part = part + char;
                    }
                    else if (context == "type" && part) {
                        mediaRange[context] = part;
                        part = "";
                        context = "subtype";
                    }
                    else {
                        console.log(context, part)
                        throw new Error();
                    }
                }
                else if (char == '"') {
                    if (quoted) {

                        if (escaped) {
                            part = part + char;
                            escaped = false;
                        }
                        else if (context == "parameter") {
                            quoted = false;
                        }
                        else if (context == "accept-ext") {
                            quoted = false;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else if (token && !part) {
                        quoted = true;
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == "\\") {
                    if (quoted && escaped) {
                        part = part + char;
                        escaped = false;
                    }
                    else if (quoted && !escaped) {
                        escaped = true;
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == ",") {

                    if (quoted) {
                        part = part + char;
                    }
                    else if (context == "subtype" && part) {
                        mediaRange[context] = part;
                    }
                    else if (context == "parameter" && token && part) {
                        if (token == "q" && !mediaRange.weight.q) {
                            mediaRange["weight"]["q"] = part;
                        }
                        else {
                            mediaRange[context][token] = part;
                        }
                    }
                    else if (context == "accept-ext" && token) {
                        mediaRange[context][token] = part;
                    }
                    else if (context == "accept-ext" && !token) {
                        mediaRange[context][part] = "";
                    }
                    else {
                        throw new Error();
                    }

                    await new Promise((r, j) => setTimeout(() => r()));

                    return [mediaRange].concat(await this.parseMediaRange(header.slice(++index)));
                }
                else {
                    if (context == "type") {
                        part = part + char;
                    }
                    else if (context == "subtype") {
                        part = part + char;
                    }
                    else if (context == "parameter" && token) {
                        //  We have a token; hence, it is a value.
                        if (quoted) {
                            part = part + char;
                        }
                        else {
                            part = part + char;
                        }
                    }
                    else if (context == "parameter" && !token) {
                        //  We do not have a token; hence, it is a name.
                        // if (this.istchar(char)) {
                        //     part = part + char;
                        // }
                        part = part + char;
                    }
                    else if (context == "accept-ext" && token) {
                        part = part + char;
                    }
                    else if (context == "accept-ext" && !token) {
                        part = part + char;
                    }
                    else {
                        throw new Error();
                    }
                }
                index = index + 1;
            }
        }

        istchar(char) {
            for (let delim in '"(),/:;<=>?@[\]{}') {
                if (char === delim)
                    return false;
            }
            let codePoint = char.codePointAt(0);
            return codePoint > 32 && codePoint < 95
        }

        // isqdtext(char) {
        //     let codePoint = char.codePointAt(0);
        //     if (
        //         codePoint == 9 || 
        //         codePoint == 32 || 
        //         codePoint == 33 ||

        //         )

        // }
    }

    let accept_header = 'text/*;q=0.3, text/html;q=0.7,text/html;level=1,text/html;level=2;q=0.4, */*;q=0.5;level="123"';

    console.log(accept_header);

    httpParser = new HTTPParser();

    let mediaRanges = null;

    try {
        mediaRanges = await httpParser.parseMediaRange(accept_header);
    }
    catch (e) {
        console.log(e);
    }

    console.log(mediaRanges);
}());