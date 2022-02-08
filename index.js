let SnapMessage = {
    props: {
        text: String,
        date: String,
        sent: Boolean
    },
    data: function() {
        return {
            sent_css_class: this.sent ? 'border-snapred' : 'border-snapblue'
        };
    },
    template: `<div class="px-4 mx-1 rounded-none border-l-4" :class="sent_css_class"><div v-html="text" class="inline"></div><div class="ml-4 text-xs text-slate-300 inline" v-html="date"></div></div>`
};

let SnapMessageGroup = {
    props: {
        messages: Array,
        username: String,
        sent: Boolean
    },
    data: function() {
        return {
            sent_css_class: this.sent ? 'text-snapred' : 'text-snapblue'
        };
    },
    components: {
        SnapMessage
    },
    template: `<div>
    <div class="mx-1 font-semibold my-0.5" :class="sent_css_class">{{ username }}</div>
    <snap-message v-for='message in messages' :key="message.key" :text='message.text' :sent='sent' :date="message.date"></snap-message>
    </div>`
}

last_key = 0;
function new_key() {
    last_key++;
    return last_key;
}

function getGroupsFromConv(json, username) {
    if (username == "") return [];
    let received = [];
    json["Received Saved Chat History"].forEach(element => {
        if (element.From == username && element['Media Type'] == "TEXT")
            received.push(element);
    });
    let sent = [];
    json["Sent Saved Chat History"].forEach(element => {
        if (element.To == username && element['Media Type'] == "TEXT")
            sent.push(element);
    });
    let index_r = received.length - 1;
    let index_s = sent.length - 1;
    let last_message_is_sent = received[index_r].Created > sent[index_s].Created;
    let last_group = [{key: new_key(), text: last_message_is_sent ? sent[index_s].Text : received[index_r].Text, date: last_message_is_sent ? sent[index_s].Created : received[index_r].Created}];
    if (last_message_is_sent)
        index_s--;
    else
        index_r--;
    let groups = [];
    while (index_r >= 0 && index_s >= 0) {
        let this_message_is_sent = received[index_r].Created > sent[index_s].Created;
        if (this_message_is_sent == last_message_is_sent) {
            last_group.push({key: new_key(), text: this_message_is_sent ? sent[index_s].Text : received[index_r].Text, date: last_message_is_sent ? sent[index_s].Created : received[index_r].Created});
        } else {
            groups.push({key: new_key(), username: (last_message_is_sent ? "Moi" : username), sent: last_message_is_sent, messages: last_group});
            last_message_is_sent = this_message_is_sent;
            last_group = [{key: new_key(), text: this_message_is_sent ? sent[index_s].Text : received[index_r].Text, date: last_message_is_sent ? sent[index_s].Created : received[index_r].Created}];
        }
        if (this_message_is_sent)
            index_s--;
        else
            index_r--;
    }
    return groups;
}

function getUsernamesFromJson(json) {
    let usernames = [];
    json["Received Saved Chat History"].forEach(element => {
        if (!usernames.includes(element.From) && element['Media Type'] == "TEXT")
            usernames.push(element.From);
    });
    json["Sent Saved Chat History"].forEach(element => {
        if (!usernames.includes(element.To) && element['Media Type'] == "TEXT")
            usernames.push(element.To);
    });
    return usernames;
}

let SnapConv = {
    props: ["username", "json"],
    components: {
        SnapMessageGroup
    },
    data: function() {
        return {
            groups: getGroupsFromConv(this.json, this.username)
        }
    },
    template: `<div><snap-message-group v-for="group in groups" :key="group.key" :messages="group.messages" :username="group.username" :sent="group.sent"></snap-message-group></div>`
}

function importFromFile( event ) {
    file = event.target.files[0];
    let reader = new FileReader( );
    reader.addEventListener( 'load', function( e ) { 
        let text = e.target.result;
        if (file.type == "application/json") {
            app.json_from_snap = JSON.parse(text);
        }
    } );
    reader.readAsText( file ); // On lance le chargement du fichier
}

json_from_snap = {}

app = new Vue({
    el: "#app",
    data: function() {
        return {
            json_from_snap,
            selected_username: ""
        }
    },
    methods: {
        loadFile: importFromFile,
    },
    computed: {
        usernames: function() {
            if (this.json_from_snap['Received Saved Chat History'] != null)
                return getUsernamesFromJson(this.json_from_snap);
            else
                return [];
        }
    },
    components: {
        SnapMessage,
        SnapMessageGroup,
        SnapConv
    }
});