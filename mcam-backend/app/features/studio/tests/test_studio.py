from app.features.studio.ordering import copy_name, reindex


def test_reindex_moves_scene():
    assert reindex(["a", "b", "c", "d"], "d", 0) == ["d", "a", "b", "c"]
    assert reindex(["a", "b", "c"], "a", 2) == ["b", "c", "a"]
    assert reindex(["a", "b"], "x", 0) == ["a", "b"]      # unknown id: no-op


def test_reindex_clamps_out_of_range():
    assert reindex(["a", "b", "c"], "a", 99) == ["b", "c", "a"]


def test_copy_name_is_unique():
    assert copy_name("Piano", set()) == "Piano (copy)"
    assert copy_name("Piano", {"Piano (copy)"}) == "Piano (copy) 2"
    assert copy_name("Piano", {"Piano (copy)", "Piano (copy) 2"}) == "Piano (copy) 3"
