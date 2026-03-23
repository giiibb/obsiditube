import pytest
from src.utils import get_nested_item, ListExactlyOne, ListExactlyOneChildDictKey

def test_get_nested_item_basic_dict():
    data = {"a": {"b": 1}}
    assert get_nested_item(data, "a", "b") == 1

def test_get_nested_item_key_error():
    data = {"a": 1}
    with pytest.raises(KeyError):
        get_nested_item(data, "b")

def test_get_nested_item_type_error_str_on_non_dict():
    data = [1, 2, 3]
    with pytest.raises(TypeError, match="Cannot use str path on non-dict"):
        get_nested_item(data, "a")

def test_get_nested_item_list_exactly_one_success():
    data = [42]
    assert get_nested_item(data, ListExactlyOne) == 42

    data = {"items": [42]}
    assert get_nested_item(data, "items", ListExactlyOne) == 42

def test_get_nested_item_list_exactly_one_type_error():
    data = {"a": 1}
    with pytest.raises(TypeError, match="Cannot use ListExactlyOne on non-list"):
        get_nested_item(data, ListExactlyOne)

def test_get_nested_item_list_exactly_one_value_error_empty():
    data = []
    with pytest.raises(ValueError, match="Expected exactly one item in list, got 0"):
        get_nested_item(data, ListExactlyOne)

def test_get_nested_item_list_exactly_one_value_error_multiple():
    data = [1, 2]
    with pytest.raises(ValueError, match="Expected exactly one item in list, got 2"):
        get_nested_item(data, ListExactlyOne)

def test_get_nested_item_list_exactly_one_child_dict_key_success():
    data = [
        {"other": 1},
        {"target": 42},
        {"another": 2}
    ]
    assert get_nested_item(data, ListExactlyOneChildDictKey, "target") == 42

def test_get_nested_item_list_exactly_one_child_dict_key_type_error():
    data = {"a": 1}
    with pytest.raises(TypeError, match="Cannot use ListExactlyOneChildDictKey on non-list"):
        get_nested_item(data, ListExactlyOneChildDictKey, "k")

def test_get_nested_item_list_exactly_one_child_dict_key_unexpected_end():
    data = [{"a": 1}]
    with pytest.raises(ValueError, match="Unexpected End of list"):
        get_nested_item(data, ListExactlyOneChildDictKey)

def test_get_nested_item_list_exactly_one_child_dict_key_non_dict_entry():
    data = [{"a": 1}, 2]
    with pytest.raises(TypeError, match="Cannot use ListExactlyOneChildDictKey on list having non dict entry"):
        get_nested_item(data, ListExactlyOneChildDictKey, "a")

def test_get_nested_item_list_exactly_one_child_dict_key_not_found():
    data = [{"a": 1}, {"b": 2}]
    with pytest.raises(ValueError, match="Expected exactly one item having the key: 'c' in list"):
        get_nested_item(data, ListExactlyOneChildDictKey, "c")

def test_get_nested_item_list_exactly_one_child_dict_key_multiple_found():
    data = [{"a": 1}, {"a": 2}]
    with pytest.raises(ValueError, match="Expected exactly one item having the key: 'a' in list"):
        get_nested_item(data, ListExactlyOneChildDictKey, "a")

def test_get_nested_item_invalid_path_element():
    data = {"a": 1}
    with pytest.raises(ValueError, match="Invalid path element: 123"):
        get_nested_item(data, 123)

def test_get_nested_item_complex_nesting():
    data = {
        "users": [
            {
                "profile": {
                    "emails": [{"address": "test@example.com", "primary": True}]
                }
            }
        ]
    }
    val = get_nested_item(data, "users", ListExactlyOne, "profile", "emails", ListExactlyOne, "address")
    assert val == "test@example.com"

    data = {
        "responses": [
            {"id": "1", "data": "first"},
            {"id": "2", "data": "second"},
            {"meta": "some meta"}
        ]
    }
    assert get_nested_item(data, "responses", ListExactlyOneChildDictKey, "meta") == "some meta"

def test_get_nested_item_empty_path():
    data = {"a": 1}
    assert get_nested_item(data) == data
