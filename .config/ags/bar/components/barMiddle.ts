const hyprland = await Service.import("hyprland");
const mpris = await Service.import("mpris");

import { playerToColor } from "utils/color";
import { playerToIcon } from "utils/icon";
import { emptyWorkspace } from "variables";
import { custom_revealer } from "widgets/revealer";


function Media()
{
    const progress = (player) => Widget.CircularProgress({
        class_name: "progress",
        rounded: true,
        inverted: false,
        startAt: 0.75,
        child: Widget.Label({
            label: player.bind("name").as(playerToIcon),
        }),
        setup: self =>
        {
            function update()
            {
                const value = player.position / player.length
                self.value = value > 0 ? value : 0
            }
            self.hook(player, update)
            // self.hook(player, update, "position")
            self.poll(1000, update)
        },
    })

    const title = (player) => Widget.Label({
        class_name: "label",
        max_width_chars: 20,
        truncate: "end",
        label: player.bind("track_title"),
    })

    const artist = (player) => Widget.Label({
        class_name: "label",
        max_width_chars: 20,
        truncate: "end",
        label: player.bind("track_artists").transform(a => "-- " + a.join(", ")),
    })

    const activePlayer = (player) => Widget.Box({
        class_name: "media",
        spacing: 5,
        children: [progress(player), title(player), artist(player)],
        css: player.bind("track_cover_url").as(t => `
            color: ${playerToColor(player.name)};
            background-image:  linear-gradient(to right, #000000 , rgba(0, 0, 0, 0.5)), url('${player.track_cover_url}');
            `,
        ),
    })

    return Widget.EventBox({
        class_name: "media-event",
        on_secondary_click: () => hyprland.messageAsync("dispatch workspace 4"),
        on_hover: () => App.openWindow("media"),

        child: Utils.watch(activePlayer(mpris.players[0]), mpris, "changed", () => activePlayer(mpris.players.find(player => player.play_back_status === "Playing"))),

    })
}




function Clock()
{
    const date_less = Variable("", {
        poll: [1000, 'date "+%H:%M"'],
    });
    const date_more = Variable("", {
        poll: [1000, 'date "+:%S %b %e, %A."']
    });

    const revealer = Widget.Label({
        css: "margin: 0px;",
        label: date_more.bind()
    })
    const trigger = Widget.Label({
        label: date_less.bind()
    })

    return custom_revealer(trigger, revealer, "date");

}

function Bandwidth()
{
    const bandwidth = Variable("", {
        // listen to an array of [up, down] values
        listen: [App.configDir + '/scripts/bandwidth.sh', out =>
        {
            return " ↑" + JSON.parse(out)[0] + " ↓" + JSON.parse(out)[1];
        }],
    });

    const icon = Widget.Icon({ icon: "network-wired-symbolic" });
    const label = Widget.Label({
        label: bandwidth.bind(),
    });

    return Widget.Box({
        class_name: "bandwidth",
        children: [icon, label],
    });
}

function AppLauncher()
{
    return Widget.Button({
        label: "",
        class_name: "app-search",
        on_clicked: () => App.toggleWindow("app-launcher"),
    });
}

function ClientTitle()
{
    return Widget.Revealer({
        revealChild: emptyWorkspace.as(empty => !empty),
        transitionDuration: 1000,
        transition: 'slide_right',
        child: Widget.Label({
            class_name: "client-title",
            truncate: "end",
            max_width_chars: 24,
            label: hyprland.active.client.bind("title"),
        })
    })
}


export function Center()
{
    return Widget.Box({
        class_name: 'bar-middle',
        spacing: 5,
        children: [Media(), Clock(), Bandwidth(), AppLauncher(), ClientTitle()],
    });
}
